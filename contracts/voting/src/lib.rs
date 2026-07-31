//! PollChain Voting Contract
//!
//! Handles proposal creation, voting, and inter-contract calls to the
//! Execution contract when a proposal passes.

#![no_std]
#![allow(clippy::too_many_arguments)]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    token::Client as TokenClient,
    Address, Env, String, Vec,
};

// ── Storage keys ────────────────────────────────────────────────────────────

#[contracttype]
pub enum DataKey {
    Config,
    ProposalCount,
    Proposal(u64),
    Vote(u64, Address), // (proposal_id, voter)
}

// ── Data types ───────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone)]
pub struct Config {
    pub admin: Address,
    pub token: Address,
    pub execution_contract: Address,
    pub delegation_contract: Address,
    pub treasury_contract: Address,
    pub reward_amount: i128,
    pub quadratic_voting: bool,
    /// Minimum POLL tokens required to create a proposal
    pub proposal_threshold: i128,
    /// Voting period in ledgers (~5 seconds each; 17280 ≈ 1 day)
    pub voting_period: u32,
    /// Minimum quorum: total votes needed for a proposal to be valid
    pub quorum: i128,
}

#[contracttype]
#[derive(Clone, PartialEq, Debug)]
pub enum ProposalStatus {
    Active,
    Passed,
    Failed,
    Executed,
    Cancelled,
}

#[contracttype]
#[derive(Clone)]
pub struct Proposal {
    pub id: u64,
    pub proposer: Address,
    pub title: String,
    pub description: String,
    /// Encoded calldata for the execution contract (stored as a string for simplicity)
    pub calldata: String,
    pub yes_votes: i128,
    pub no_votes: i128,
    pub abstain_votes: i128,
    pub start_ledger: u32,
    pub end_ledger: u32,
    pub status: ProposalStatus,
    pub created_at: u64,
}

#[contracttype]
#[derive(Clone, PartialEq, Debug)]
pub enum VoteChoice {
    Yes,
    No,
    Abstain,
}

#[contracttype]
#[derive(Clone)]
pub struct VoteRecord {
    pub voter: Address,
    pub choice: VoteChoice,
    pub weight: i128,
    pub ledger: u32,
}

// ── Execution contract interface ─────────────────────────────────────────────

mod execution_interface {
    use soroban_sdk::{contractclient, Address, Env, String};

    #[allow(dead_code)]
    #[contractclient(name = "ExecutionClient")]
    pub trait ExecutionInterface {
        fn execute(env: Env, caller: Address, proposal_id: u64, calldata: String);
    }
}

use execution_interface::ExecutionClient;

// ── Delegation contract interface ────────────────────────────────────────────

mod delegation_interface {
    use soroban_sdk::{contractclient, Address, Env};

    #[allow(dead_code)]
    #[contractclient(name = "DelegationClient")]
    pub trait DelegationInterface {
        fn get_voting_power(env: Env, address: Address) -> i128;
    }
}

use delegation_interface::DelegationClient;

// ── Treasury contract interface ──────────────────────────────────────────────

mod treasury_interface {
    use soroban_sdk::{contractclient, Address, Env};

    #[allow(dead_code)]
    #[contractclient(name = "TreasuryClient")]
    pub trait TreasuryInterface {
        fn withdraw(env: Env, caller: Address, to: Address, amount: i128);
    }
}

use treasury_interface::TreasuryClient;

// ── Integer square root helper for Quadratic Voting ─────────────────────────

fn isqrt(n: i128) -> i128 {
    if n <= 0 {
        return 0;
    }
    let mut x = n;
    let mut y = (x + 1) / 2;
    while y < x {
        x = y;
        y = (x + n / x) / 2;
    }
    x
}

// ── Contract ─────────────────────────────────────────────────────────────────

#[contract]
pub struct VotingContract;

#[contractimpl]
impl VotingContract {
    // ── Admin ────────────────────────────────────────────────────────────────

    /// Initialize the voting contract.
    pub fn initialize(
        env: Env,
        admin: Address,
        token: Address,
        execution_contract: Address,
        delegation_contract: Address,
        treasury_contract: Address,
        reward_amount: i128,
        quadratic_voting: bool,
        proposal_threshold: i128,
        voting_period: u32,
        quorum: i128,
    ) {
        if env.storage().instance().has(&DataKey::Config) {
            panic!("already initialized");
        }
        let config = Config {
            admin,
            token,
            execution_contract,
            delegation_contract,
            treasury_contract,
            reward_amount,
            quadratic_voting,
            proposal_threshold,
            voting_period,
            quorum,
        };
        env.storage().instance().set(&DataKey::Config, &config);
        env.storage()
            .instance()
            .set(&DataKey::ProposalCount, &0u64);
    }

    /// Update config. Admin only.
    pub fn update_config(
        env: Env,
        delegation_contract: Address,
        treasury_contract: Address,
        reward_amount: i128,
        quadratic_voting: bool,
        proposal_threshold: i128,
        voting_period: u32,
        quorum: i128,
    ) {
        let mut config: Config = env.storage().instance().get(&DataKey::Config).unwrap();
        config.admin.require_auth();
        config.delegation_contract = delegation_contract;
        config.treasury_contract = treasury_contract;
        config.reward_amount = reward_amount;
        config.quadratic_voting = quadratic_voting;
        config.proposal_threshold = proposal_threshold;
        config.voting_period = voting_period;
        config.quorum = quorum;
        env.storage().instance().set(&DataKey::Config, &config);
    }

    // ── Proposals ────────────────────────────────────────────────────────────

    /// Create a new proposal. Caller must hold >= proposal_threshold POLL tokens.
    pub fn create_proposal(
        env: Env,
        proposer: Address,
        title: String,
        description: String,
        calldata: String,
    ) -> u64 {
        proposer.require_auth();
        let config: Config = env.storage().instance().get(&DataKey::Config).unwrap();
        let token = TokenClient::new(&env, &config.token);
        let balance = token.balance(&proposer);
        assert!(
            balance >= config.proposal_threshold,
            "insufficient POLL tokens to propose"
        );

        let count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::ProposalCount)
            .unwrap();
        let id = count + 1;

        let now = env.ledger().sequence();
        let proposal = Proposal {
            id,
            proposer: proposer.clone(),
            title,
            description,
            calldata,
            yes_votes: 0,
            no_votes: 0,
            abstain_votes: 0,
            start_ledger: now,
            end_ledger: now + config.voting_period,
            status: ProposalStatus::Active,
            created_at: env.ledger().timestamp(),
        };

        env.storage()
            .persistent()
            .set(&DataKey::Proposal(id), &proposal);
        env.storage()
            .instance()
            .set(&DataKey::ProposalCount, &id);

        env.events()
            .publish((symbol_short!("PROPOSE"),), (id, proposer));
        id
    }

    /// Cast a vote on an active proposal.
    pub fn vote(env: Env, voter: Address, proposal_id: u64, choice: VoteChoice) {
        voter.require_auth();

        // Check voter hasn't already voted
        let vote_key = DataKey::Vote(proposal_id, voter.clone());
        assert!(
            !env.storage().persistent().has(&vote_key),
            "already voted"
        );

        let mut proposal: Proposal = env
            .storage()
            .persistent()
            .get(&DataKey::Proposal(proposal_id))
            .expect("proposal not found");

        assert!(
            proposal.status == ProposalStatus::Active,
            "proposal not active"
        );
        assert!(
            env.ledger().sequence() <= proposal.end_ledger,
            "voting period ended"
        );

        let config: Config = env.storage().instance().get(&DataKey::Config).unwrap();
        let delegation_client = DelegationClient::new(&env, &config.delegation_contract);
        let mut weight = delegation_client.get_voting_power(&voter);
        assert!(weight > 0, "no voting power");

        if config.quadratic_voting {
            weight = isqrt(weight);
            assert!(weight > 0, "no quadratic voting power");
        }

        match choice {
            VoteChoice::Yes => proposal.yes_votes += weight,
            VoteChoice::No => proposal.no_votes += weight,
            VoteChoice::Abstain => proposal.abstain_votes += weight,
        }

        let record = VoteRecord {
            voter: voter.clone(),
            choice: choice.clone(),
            weight,
            ledger: env.ledger().sequence(),
        };
        env.storage().persistent().set(&vote_key, &record);
        env.storage()
            .persistent()
            .set(&DataKey::Proposal(proposal_id), &proposal);

        if config.reward_amount > 0 {
            let treasury_client = TreasuryClient::new(&env, &config.treasury_contract);
            let self_address = env.current_contract_address();
            treasury_client.withdraw(&self_address, &voter, &config.reward_amount);
        }

        env.events()
            .publish((symbol_short!("VOTE"),), (proposal_id, voter, choice, weight));
    }

    /// Finalize a proposal after voting period ends.
    /// Determines pass/fail and triggers execution if passed.
    pub fn finalize(env: Env, proposal_id: u64) {
        let mut proposal: Proposal = env
            .storage()
            .persistent()
            .get(&DataKey::Proposal(proposal_id))
            .expect("proposal not found");

        assert!(
            proposal.status == ProposalStatus::Active,
            "proposal not active"
        );
        assert!(
            env.ledger().sequence() > proposal.end_ledger,
            "voting period not ended"
        );

        let config: Config = env.storage().instance().get(&DataKey::Config).unwrap();
        let total_votes = proposal.yes_votes + proposal.no_votes + proposal.abstain_votes;

        if total_votes < config.quorum {
            proposal.status = ProposalStatus::Failed;
            env.storage()
                .persistent()
                .set(&DataKey::Proposal(proposal_id), &proposal);
            env.events()
                .publish((symbol_short!("FAIL"),), (proposal_id, "quorum not met"));
            return;
        }

        if proposal.yes_votes > proposal.no_votes {
            proposal.status = ProposalStatus::Passed;
            env.storage()
                .persistent()
                .set(&DataKey::Proposal(proposal_id), &proposal);

            // ── Inter-contract call to Execution contract ──────────────────
            let exec_client = ExecutionClient::new(&env, &config.execution_contract);
            // The voting contract itself is the caller — execution contract
            // must accept the voting contract address as authorized.
            let voting_contract_addr = env.current_contract_address();
            exec_client.execute(
                &voting_contract_addr,
                &proposal_id,
                &proposal.calldata,
            );

            proposal.status = ProposalStatus::Executed;
            env.storage()
                .persistent()
                .set(&DataKey::Proposal(proposal_id), &proposal);
            env.events()
                .publish((symbol_short!("EXECUTE"),), (proposal_id,));
        } else {
            proposal.status = ProposalStatus::Failed;
            env.storage()
                .persistent()
                .set(&DataKey::Proposal(proposal_id), &proposal);
            env.events()
                .publish((symbol_short!("FAIL"),), (proposal_id, "no votes won"));
        }
    }

    /// Cancel a proposal. Only proposer or admin can cancel.
    pub fn cancel(env: Env, caller: Address, proposal_id: u64) {
        caller.require_auth();
        let mut proposal: Proposal = env
            .storage()
            .persistent()
            .get(&DataKey::Proposal(proposal_id))
            .expect("proposal not found");

        let config: Config = env.storage().instance().get(&DataKey::Config).unwrap();
        assert!(
            caller == proposal.proposer || caller == config.admin,
            "not authorized"
        );
        assert!(
            proposal.status == ProposalStatus::Active,
            "can only cancel active proposals"
        );

        proposal.status = ProposalStatus::Cancelled;
        env.storage()
            .persistent()
            .set(&DataKey::Proposal(proposal_id), &proposal);
        env.events()
            .publish((symbol_short!("CANCEL"),), (proposal_id,));
    }

    // ── Queries ──────────────────────────────────────────────────────────────

    pub fn get_proposal(env: Env, proposal_id: u64) -> Proposal {
        env.storage()
            .persistent()
            .get(&DataKey::Proposal(proposal_id))
            .expect("proposal not found")
    }

    pub fn get_vote(env: Env, proposal_id: u64, voter: Address) -> Option<VoteRecord> {
        env.storage()
            .persistent()
            .get(&DataKey::Vote(proposal_id, voter))
    }

    pub fn proposal_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::ProposalCount)
            .unwrap_or(0)
    }

    pub fn get_config(env: Env) -> Config {
        env.storage().instance().get(&DataKey::Config).unwrap()
    }

    pub fn get_proposals(env: Env, from: u64, limit: u64) -> Vec<Proposal> {
        let count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::ProposalCount)
            .unwrap_or(0);
        let mut proposals = Vec::new(&env);
        let start = if from == 0 { 1 } else { from };
        let end = (start + limit).min(count + 1);
        for i in start..end {
            if let Some(p) = env
                .storage()
                .persistent()
                .get::<DataKey, Proposal>(&DataKey::Proposal(i))
            {
                proposals.push_back(p);
            }
        }
        proposals
    }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod test {
    use super::*;
    use governance_token::{GovernanceToken, GovernanceTokenClient};
    use execution::{ExecutionContract, ExecutionContractClient};
    use delegation::{DelegationContract, DelegationContractClient};
    use treasury::{TreasuryContract, TreasuryContractClient};
    use soroban_sdk::{testutils::{Address as _, Ledger as _}, Env};

    fn setup(env: &Env) -> (
        Address,
        Address,
        Address,
        Address,
        Address,
        GovernanceTokenClient<'_>,
        VotingContractClient<'_>,
        ExecutionContractClient<'_>,
        DelegationContractClient<'_>,
    ) {
        let admin = Address::generate(env);
        let token_id = env.register(GovernanceToken, ());
        let exec_id = env.register(ExecutionContract, ());
        let del_id = env.register(DelegationContract, ());
        let treasury_id = env.register(TreasuryContract, ());
        let voting_id = env.register(VotingContract, ());

        let token = GovernanceTokenClient::new(env, &token_id);
        let voting = VotingContractClient::new(env, &voting_id);
        let exec = ExecutionContractClient::new(env, &exec_id);
        let del = DelegationContractClient::new(env, &del_id);
        let treasury = TreasuryContractClient::new(env, &treasury_id);

        token.initialize(
            &admin,
            &String::from_str(env, "PollChain Governance"),
            &String::from_str(env, "POLL"),
            &7,
            &0,
        );

        treasury.initialize(&admin, &token_id, &voting_id, &exec_id);
        exec.initialize(&admin, &voting_id, &treasury_id, &token_id);
        del.initialize(&admin, &token_id);

        // Mint and deposit to fund the treasury so that executions and rewards can succeed
        token.mint(&admin, &1_000_000_000_000);
        treasury.deposit(&admin, &500_000_000_000);

        voting.initialize(
            &admin,
            &token_id,
            &exec_id,
            &del_id,
            &treasury_id,
            &5_0000000,    // 5 POLL reward per vote
            &false,        // quadratic_voting: false
            &100_0000000,  // 100 POLL threshold
            &100,          // 100 ledgers voting period
            &10_0000000,   // 10 POLL quorum
        );

        (admin, token_id, voting_id, del_id, treasury_id, token, voting, exec, del)
    }

    #[test]
    fn test_create_proposal() {
        let env = Env::default();
        env.mock_all_auths();
        let (admin, _token_id, _voting_id, _del_id, _treasury_id, token, voting, _exec, _del) = setup(&env);

        token.mint(&admin, &1000_0000000);
        let id = voting.create_proposal(
            &admin,
            &String::from_str(&env, "Test Proposal"),
            &String::from_str(&env, "A test proposal description"),
            &String::from_str(&env, "{}"),
        );
        assert_eq!(id, 1);
        assert_eq!(voting.proposal_count(), 1);
    }

    #[test]
    fn test_vote_and_finalize_pass() {
        let env = Env::default();
        env.mock_all_auths();
        let (admin, _token_id, _voting_id, _del_id, _treasury_id, token, voting, _exec, _del) = setup(&env);

        let voter1 = Address::generate(&env);
        let voter2 = Address::generate(&env);

        token.mint(&admin, &1000_0000000);
        token.mint(&voter1, &500_0000000);
        token.mint(&voter2, &200_0000000);

        let id = voting.create_proposal(
            &admin,
            &String::from_str(&env, "Fund Community Pool"),
            &String::from_str(&env, "Allocate 1000 POLL to community pool"),
            &String::from_str(&env, r#"{"action":"fund","amount":1000}"#),
        );

        voting.vote(&voter1, &id, &VoteChoice::Yes);
        voting.vote(&voter2, &id, &VoteChoice::Yes);

        // Advance ledger past voting period
        env.ledger().with_mut(|l| l.sequence_number += 101);

        voting.finalize(&id);

        let proposal = voting.get_proposal(&id);
        assert_eq!(proposal.status, ProposalStatus::Executed);
        assert_eq!(proposal.yes_votes, 700_0000000);
    }

    #[test]
    fn test_vote_and_finalize_fail() {
        let env = Env::default();
        env.mock_all_auths();
        let (admin, _token_id, _voting_id, _del_id, _treasury_id, token, voting, _exec, _del) = setup(&env);

        let voter1 = Address::generate(&env);
        token.mint(&admin, &1000_0000000);
        token.mint(&voter1, &500_0000000);

        let id = voting.create_proposal(
            &admin,
            &String::from_str(&env, "Rejected Proposal"),
            &String::from_str(&env, "This should fail"),
            &String::from_str(&env, "{}"),
        );

        voting.vote(&voter1, &id, &VoteChoice::No);

        env.ledger().with_mut(|l| l.sequence_number += 101);
        voting.finalize(&id);

        let proposal = voting.get_proposal(&id);
        assert_eq!(proposal.status, ProposalStatus::Failed);
    }

    #[test]
    #[should_panic(expected = "already voted")]
    fn test_double_vote_panics() {
        let env = Env::default();
        env.mock_all_auths();
        let (admin, _token_id, _voting_id, _del_id, _treasury_id, token, voting, _exec, _del) = setup(&env);

        token.mint(&admin, &1000_0000000);
        let id = voting.create_proposal(
            &admin,
            &String::from_str(&env, "Double Vote Test"),
            &String::from_str(&env, "desc"),
            &String::from_str(&env, "{}"),
        );
        voting.vote(&admin, &id, &VoteChoice::Yes);
        voting.vote(&admin, &id, &VoteChoice::Yes); // should panic
    }

    #[test]
    fn test_cancel_proposal() {
        let env = Env::default();
        env.mock_all_auths();
        let (admin, _token_id, _voting_id, _del_id, _treasury_id, token, voting, _exec, _del) = setup(&env);

        token.mint(&admin, &1000_0000000);
        let id = voting.create_proposal(
            &admin,
            &String::from_str(&env, "Cancel Me"),
            &String::from_str(&env, "desc"),
            &String::from_str(&env, "{}"),
        );
        voting.cancel(&admin, &id);
        let proposal = voting.get_proposal(&id);
        assert_eq!(proposal.status, ProposalStatus::Cancelled);
    }

    #[test]
    fn test_quorum_not_met() {
        let env = Env::default();
        env.mock_all_auths();
        let (admin, _token_id, _voting_id, _del_id, _treasury_id, token, voting, _exec, _del) = setup(&env);

        // Give admin just enough to propose but not enough for quorum
        token.mint(&admin, &100_0000000);
        // voter with tiny balance
        let tiny_voter = Address::generate(&env);
        token.mint(&tiny_voter, &1_0000000); // 1 POLL, quorum is 10 POLL

        let id = voting.create_proposal(
            &admin,
            &String::from_str(&env, "Low Turnout"),
            &String::from_str(&env, "desc"),
            &String::from_str(&env, "{}"),
        );
        voting.vote(&tiny_voter, &id, &VoteChoice::Yes);

        env.ledger().with_mut(|l| l.sequence_number += 101);
        voting.finalize(&id);

        let proposal = voting.get_proposal(&id);
        assert_eq!(proposal.status, ProposalStatus::Failed);
    }

    #[test]
    fn test_vote_with_delegated_power() {
        let env = Env::default();
        env.mock_all_auths();
        let (admin, _token_id, _voting_id, _del_id, _treasury_id, token, voting, _exec, del) = setup(&env);

        let delegatee = Address::generate(&env);
        let delegator = Address::generate(&env);

        // Mint tokens
        token.mint(&admin, &1000_0000000);
        token.mint(&delegatee, &300_0000000);
        token.mint(&delegator, &500_0000000);

        // Delegate from delegator to delegatee
        del.delegate(&delegator, &delegatee);

        let id = voting.create_proposal(
            &admin,
            &String::from_str(&env, "Delegated Vote Proposal"),
            &String::from_str(&env, "desc"),
            &String::from_str(&env, "{}"),
        );

        // Delegatee votes
        voting.vote(&delegatee, &id, &VoteChoice::Yes);

        let proposal = voting.get_proposal(&id);
        // Total weight should be delegatee's 300 + delegator's 500 = 800
        assert_eq!(proposal.yes_votes, 800_0000000);
    }

    #[test]
    fn test_vote_awards_rewards() {
        let env = Env::default();
        env.mock_all_auths();
        let (admin, _token_id, _voting_id, _del_id, _treasury_id, token, voting, _exec, _del) = setup(&env);

        let voter1 = Address::generate(&env);
        token.mint(&voter1, &100_0000000);

        let id = voting.create_proposal(
            &admin,
            &String::from_str(&env, "Rewards Proposal"),
            &String::from_str(&env, "desc"),
            &String::from_str(&env, "{}"),
        );

        let balance_before = token.balance(&voter1);
        voting.vote(&voter1, &id, &VoteChoice::Yes);
        let balance_after = token.balance(&voter1);

        // Balance after should be balance before + 5 POLL reward
        assert_eq!(balance_after, balance_before + 5_0000000);
    }

    #[test]
    fn test_quadratic_voting_calculation() {
        let env = Env::default();
        env.mock_all_auths();
        let (admin, _token_id, _voting_id, del_id, treasury_id, token, voting, _exec, _del) =
            setup(&env);

        // Enable Quadratic Voting via update_config
        voting.update_config(&del_id, &treasury_id, &5_0000000, &true, &100_0000000, &100, &10_0000000);

        let voter = Address::generate(&env);
        
        // Mint 10,000 POLL tokens (10000 * 10^7 = 100_000_0000000)
        token.mint(&admin, &1_000_000_000_000);
        token.mint(&voter, &1_000_000_000_000);

        let id = voting.create_proposal(
            &admin,
            &String::from_str(&env, "QV Proposal"),
            &String::from_str(&env, "desc"),
            &String::from_str(&env, "{}"),
        );

        voting.vote(&voter, &id, &VoteChoice::Yes);

        let proposal = voting.get_proposal(&id);
        // sqrt(100_000_0000000) = sqrt(1,000,000,000,000) = 1,000,000
        // 1,000,000 is 0.1 POLL in 7 decimals
        assert_eq!(proposal.yes_votes, 1_000_000);
    }
}
