//! PollChain Execution Contract
//!
//! Called by the Voting contract via inter-contract call when a proposal passes.
//! Records executed proposals and emits events. Can be extended to perform
//! on-chain actions (treasury transfers, parameter updates, etc.).

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Env, String, Vec,
};

#[contracttype]
pub enum DataKey {
    Config,
    ExecutionLog,
    ExecutionCount,
}

#[contracttype]
#[derive(Clone)]
pub struct ExecutionConfig {
    pub admin: Address,
    pub voting_contract: Address,
    pub treasury_contract: Address,
    pub token_contract: Address,
}

#[contracttype]
#[derive(Clone)]
pub struct ExecutionRecord {
    pub proposal_id: u64,
    pub calldata: String,
    pub executed_at: u64,
    pub executed_ledger: u32,
}

// ── Helpers for parsing JSON in no_std ────────────────────────────────────────

fn get_json_string_value<'a>(json: &'a str, key: &str) -> Option<&'a str> {
    if let Some(pos) = json.find(key) {
        let sub = &json[pos + key.len()..];
        if let Some(colon_pos) = sub.find(':') {
            let val_part = &sub[colon_pos + 1..];
            if let Some(first_quote) = val_part.find('"') {
                let val_start = &val_part[first_quote + 1..];
                if let Some(end_quote) = val_start.find('"') {
                    return Some(&val_start[..end_quote]);
                }
            }
        }
    }
    None
}

fn get_json_number_value(json: &str, key: &str) -> Option<i128> {
    if let Some(pos) = json.find(key) {
        let sub = &json[pos + key.len()..];
        if let Some(colon_pos) = sub.find(':') {
            let val_part = sub[colon_pos + 1..].trim_start();
            let mut end = 0;
            let bytes = val_part.as_bytes();
            while end < bytes.len() && ((bytes[end] >= b'0' && bytes[end] <= b'9') || bytes[end] == b'-') {
                end += 1;
            }
            if end > 0 {
                let mut num: i128 = 0;
                let mut is_neg = false;
                for (i, &b) in val_part.as_bytes()[..end].iter().enumerate() {
                    if i == 0 && b == b'-' {
                        is_neg = true;
                    } else {
                        num = num * 10 + (b - b'0') as i128;
                    }
                }
                if is_neg {
                    num = -num;
                }
                return Some(num);
            }
        }
    }
    None
}

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

#[contract]
pub struct ExecutionContract;

#[contractimpl]
impl ExecutionContract {
    /// Initialize the execution contract.
    pub fn initialize(
        env: Env,
        admin: Address,
        voting_contract: Address,
        treasury_contract: Address,
        token_contract: Address,
    ) {
        if env.storage().instance().has(&DataKey::Config) {
            panic!("already initialized");
        }
        let config = ExecutionConfig {
            admin,
            voting_contract,
            treasury_contract,
            token_contract,
        };
        env.storage().instance().set(&DataKey::Config, &config);
        env.storage()
            .instance()
            .set(&DataKey::ExecutionCount, &0u64);
        env.storage()
            .instance()
            .set(&DataKey::ExecutionLog, &Vec::<ExecutionRecord>::new(&env));
    }

    /// Execute a passed proposal. Only callable by the voting contract.
    pub fn execute(env: Env, caller: Address, proposal_id: u64, calldata: String) {
        let config: ExecutionConfig =
            env.storage().instance().get(&DataKey::Config).unwrap();

        assert!(
            caller == config.admin || caller == config.voting_contract,
            "unauthorized caller"
        );

        let record = ExecutionRecord {
            proposal_id,
            calldata: calldata.clone(),
            executed_at: env.ledger().timestamp(),
            executed_ledger: env.ledger().sequence(),
        };

        let mut log: Vec<ExecutionRecord> = env
            .storage()
            .instance()
            .get(&DataKey::ExecutionLog)
            .unwrap_or_else(|| Vec::new(&env));
        log.push_back(record);
        env.storage().instance().set(&DataKey::ExecutionLog, &log);

        let count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::ExecutionCount)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::ExecutionCount, &(count + 1));

        // ── Parse calldata and call Treasury if matching ──────────────────
        let len = calldata.len() as usize;
        let mut buf = [0u8; 256];
        if len > 0 && len <= 256 {
            calldata.copy_into_slice(&mut buf[..len]);
            if let Ok(calldata_str) = core::str::from_utf8(&buf[..len]) {
                if let Some(action) = get_json_string_value(calldata_str, "action") {
                    if action == "fund" || action == "transfer" {
                        let recipient_str = get_json_string_value(calldata_str, "recipient");
                        let amount = get_json_number_value(calldata_str, "amount");

                        if let Some(amt) = amount {
                            let recipient = match recipient_str {
                                Some(r_str) => Address::from_string(&soroban_sdk::String::from_str(&env, r_str)),
                                None => config.admin.clone(),
                            };

                            let treasury_client = TreasuryClient::new(&env, &config.treasury_contract);
                            let self_address = env.current_contract_address();
                            treasury_client.withdraw(&self_address, &recipient, &amt);
                        }
                    }
                }
            }
        }

        env.events().publish(
            (symbol_short!("EXEC"),),
            (proposal_id, calldata),
        );
    }

    /// Get all execution records.
    pub fn get_log(env: Env) -> Vec<ExecutionRecord> {
        env.storage()
            .instance()
            .get(&DataKey::ExecutionLog)
            .unwrap_or_else(|| Vec::new(&env))
    }

    /// Get execution count.
    pub fn execution_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::ExecutionCount)
            .unwrap_or(0)
    }

    /// Get config.
    pub fn get_config(env: Env) -> ExecutionConfig {
        env.storage().instance().get(&DataKey::Config).unwrap()
    }

    /// Update voting contract address. Admin only.
    pub fn set_voting_contract(env: Env, new_voting: Address) {
        let mut config: ExecutionConfig =
            env.storage().instance().get(&DataKey::Config).unwrap();
        config.admin.require_auth();
        config.voting_contract = new_voting;
        env.storage().instance().set(&DataKey::Config, &config);
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use governance_token::{GovernanceToken, GovernanceTokenClient};
    use treasury::{TreasuryContract, TreasuryContractClient};
    use soroban_sdk::{testutils::Address as _, Env, String as SorobanString};

    fn setup(env: &Env) -> (
        Address,
        Address,
        Address,
        Address,
        ExecutionContractClient,
        GovernanceTokenClient,
        TreasuryContractClient,
    ) {
        let admin = Address::generate(env);
        let voting = Address::generate(env);
        let token_id = env.register(GovernanceToken, ());
        let treasury_id = env.register(TreasuryContract, ());
        let exec_id = env.register(ExecutionContract, ());

        let token = GovernanceTokenClient::new(env, &token_id);
        let treasury = TreasuryContractClient::new(env, &treasury_id);
        let exec = ExecutionContractClient::new(env, &exec_id);

        token.initialize(
            &admin,
            &SorobanString::from_str(env, "PollChain Governance"),
            &SorobanString::from_str(env, "POLL"),
            &7,
            &0,
        );

        treasury.initialize(&admin, &token_id, &voting, &exec_id);

        exec.initialize(&admin, &voting, &treasury_id, &token_id);

        (admin, voting, treasury_id, token_id, exec, token, treasury)
    }

    #[test]
    fn test_initialize() {
        let env = Env::default();
        env.mock_all_auths();
        let (_admin, _voting, _treasury_id, _token_id, client, _token, _treasury) = setup(&env);
        assert_eq!(client.execution_count(), 0);
    }

    #[test]
    fn test_execute_records_log() {
        let env = Env::default();
        env.mock_all_auths();
        let (admin, voting, _treasury_id, _token_id, client, token, treasury) = setup(&env);

        token.mint(&admin, &5000_0000000);
        treasury.deposit(&admin, &5000_0000000);

        client.execute(
            &voting,
            &1u64,
            &SorobanString::from_str(&env, r#"{"action":"fund","amount":1000}"#),
        );
        assert_eq!(client.execution_count(), 1);
        let log = client.get_log();
        assert_eq!(log.len(), 1);
        assert_eq!(log.get(0).unwrap().proposal_id, 1);
    }

    #[test]
    #[should_panic(expected = "already initialized")]
    fn test_double_initialize_panics() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(ExecutionContract, ());
        let client = ExecutionContractClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        let voting = Address::generate(&env);
        let treasury = Address::generate(&env);
        let token = Address::generate(&env);
        client.initialize(&admin, &voting, &treasury, &token);
        client.initialize(&admin, &voting, &treasury, &token);
    }

    #[test]
    fn test_execute_and_withdraws_from_treasury() {
        let env = Env::default();
        env.mock_all_auths();
        let (admin, voting, _treasury_id, _token_id, client, token, treasury) = setup(&env);

        // Deposit some tokens to treasury
        token.mint(&admin, &10000_0000000);
        treasury.deposit(&admin, &5000_0000000);
        assert_eq!(treasury.get_balance(), 5000_0000000);

        // Run execution (should trigger withdrawal of 2000 POLL to admin)
        client.execute(
            &voting,
            &1u64,
            &SorobanString::from_str(&env, r#"{"action":"fund","amount":20000000000}"#),
        );

        // Check balances
        assert_eq!(treasury.get_balance(), 3000_0000000);
        assert_eq!(token.balance(&admin), 7000_0000000);
    }

    #[test]
    fn test_execute_and_withdraws_to_specific_recipient() {
        let env = Env::default();
        env.mock_all_auths();
        let (admin, voting, _treasury_id, _token_id, client, token, treasury) = setup(&env);

        // Deposit some tokens to treasury
        token.mint(&admin, &10000_0000000);
        treasury.deposit(&admin, &5000_0000000);

        // GD3BFFX7DTNJAGDVVM5RYGGQQNURZTH4VSBLWF55YXY3L6T2WWZK57EI is a valid public key
        let recipient_str = "GD3BFFX7DTNJAGDVVM5RYGGQQNURZTH4VSBLWF55YXY3L6T2WWZK57EI";
        let recipient_addr = Address::from_string(&SorobanString::from_str(&env, recipient_str));

        // Execute withdrawal of 3000 POLL to recipient
        client.execute(
            &voting,
            &2u64,
            &SorobanString::from_str(
                &env,
                r#"{"action":"transfer","recipient":"GD3BFFX7DTNJAGDVVM5RYGGQQNURZTH4VSBLWF55YXY3L6T2WWZK57EI","amount":30000000000}"#,
            ),
        );

        // Check balances
        assert_eq!(treasury.get_balance(), 2000_0000000);
        assert_eq!(token.balance(&recipient_addr), 3000_0000000);
    }
}
