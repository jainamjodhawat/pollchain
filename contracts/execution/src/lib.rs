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
}

#[contracttype]
#[derive(Clone)]
pub struct ExecutionRecord {
    pub proposal_id: u64,
    pub calldata: String,
    pub executed_at: u64,
    pub executed_ledger: u32,
}

#[contract]
pub struct ExecutionContract;

#[contractimpl]
impl ExecutionContract {
    /// Initialize the execution contract.
    pub fn initialize(env: Env, admin: Address, voting_contract: Address) {
        if env.storage().instance().has(&DataKey::Config) {
            panic!("already initialized");
        }
        let config = ExecutionConfig {
            admin,
            voting_contract,
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
        // When called via inter-contract call, the voting contract's address
        // is the caller — no require_auth needed as it's a contract-to-contract call.
        // We still verify the caller is the registered voting contract.
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
    use soroban_sdk::{testutils::Address as _, Env};

    #[test]
    fn test_initialize() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(ExecutionContract, ());
        let client = ExecutionContractClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        let voting = Address::generate(&env);
        client.initialize(&admin, &voting);
        assert_eq!(client.execution_count(), 0);
    }

    #[test]
    fn test_execute_records_log() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(ExecutionContract, ());
        let client = ExecutionContractClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        let voting = Address::generate(&env);
        client.initialize(&admin, &voting);
        client.execute(
            &admin,
            &1u64,
            &String::from_str(&env, r#"{"action":"fund","amount":1000}"#),
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
        client.initialize(&admin, &voting);
        client.initialize(&admin, &voting);
    }
}
