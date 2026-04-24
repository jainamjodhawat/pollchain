//! PollChain Voting Contract
//!
//! Handles proposal creation, voting, and inter-contract calls to the
//! Execution contract when a proposal passes.

#![no_std]

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

    #[contractclient(name = "ExecutionClient")]
    pub trait ExecutionInterface {
        fn execute(env: Env, caller: Address, proposal_id: u64, calldata: String);
    }
}

use execution_interface::ExecutionClient;

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
        proposal_threshold: i128,
        voting_period: u32,
        quorum: i128,
    ) {
        let mut config: Config = env.storage().instance().get(&DataKey::Config).unwrap();
        config.admin.require_auth();
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
        let token = TokenClient::new(&env, &config.token);
        let weight = token.balance(&voter);
        assert!(weight > 0, "no voting power");

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
    use soroban_sdk::{testutils::{Address as _, Ledger as _}, Env};

    fn setup(env: &Env) -> (
        Address,
        Address,
        Address,
        GovernanceTokenClient,
        VotingContractClient,
        ExecutionContractClient,
    ) {
        let admin = Address::generate(env);
        let token_id = env.register(GovernanceToken, ());
        let exec_id = env.register(ExecutionContract, ());
        let voting_id = env.register(VotingContract, ());

        let token = GovernanceTokenClient::new(env, &token_id);
        let voting = VotingContractClient::new(env, &voting_id);
        let exec = ExecutionContractClient::new(env, &exec_id);

        token.initialize(
            &admin,
            &String::from_str(env, "PollChain Governance"),
            &String::from_str(env, "POLL"),
            &7,
            &0,
        );

        exec.initialize(&admin, &voting_id);

        voting.initialize(
            &admin,
            &token_id,
            &exec_id,
            &100_0000000,  // 100 POLL threshold
            &100,          // 100 ledgers voting period
            &10_0000000,   // 10 POLL quorum
        );

        (admin, token_id, voting_id, token, voting, exec)
    }

    #[test]
    fn test_create_proposal() {
        let env = Env::default();
        env.mock_all_auths();
        let (admin, _token_id, _voting_id, token, voting, _exec) = setup(&env);

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
        let (admin, _token_id, _voting_id, token, voting, _exec) = setup(&env);

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
        let (admin, _token_id, _voting_id, token, voting, _exec) = setup(&env);

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
        let (admin, _token_id, _voting_id, token, voting, _exec) = setup(&env);

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
        let (admin, _token_id, _voting_id, token, voting, _exec) = setup(&env);

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
        let (admin, _token_id, _voting_id, token, voting, _exec) = setup(&env);

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
}
