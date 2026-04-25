//! PollChain Treasury Contract
//! Holds POLL tokens. Deposits open to all. Withdrawals only by admin or voting contract.

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    token::Client as TokenClient,
    Address, Env, Vec,
};

#[contracttype]
pub enum DataKey {
    Config,
    Transactions,
}

#[contracttype]
#[derive(Clone)]
pub struct TreasuryConfig {
    pub admin: Address,
    pub token: Address,
    pub voting_contract: Address,
    pub total_deposited: i128,
    pub total_withdrawn: i128,
}

#[contracttype]
#[derive(Clone)]
pub struct TreasuryTx {
    pub kind: TxKind,
    pub from_or_to: Address,
    pub amount: i128,
    pub ledger: u32,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone)]
pub enum TxKind {
    Deposit,
    Withdraw,
}

#[contract]
pub struct TreasuryContract;

#[contractimpl]
impl TreasuryContract {
    pub fn initialize(
        env: Env,
        admin: Address,
        token: Address,
        voting_contract: Address,
    ) {
        if env.storage().instance().has(&DataKey::Config) {
            panic!("already initialized");
        }
        let config = TreasuryConfig {
            admin,
            token,
            voting_contract,
            total_deposited: 0,
            total_withdrawn: 0,
        };
        env.storage().instance().set(&DataKey::Config, &config);
        env.storage()
            .instance()
            .set(&DataKey::Transactions, &Vec::<TreasuryTx>::new(&env));
    }

    /// Anyone can deposit POLL into the treasury.
    pub fn deposit(env: Env, from: Address, amount: i128) {
        from.require_auth();
        assert!(amount > 0, "amount must be positive");
        let mut config: TreasuryConfig =
            env.storage().instance().get(&DataKey::Config).unwrap();
        let token = TokenClient::new(&env, &config.token);
        token.transfer(&from, &env.current_contract_address(), &amount);

        config.total_deposited += amount;
        env.storage().instance().set(&DataKey::Config, &config);

        let tx = TreasuryTx {
            kind: TxKind::Deposit,
            from_or_to: from.clone(),
            amount,
            ledger: env.ledger().sequence(),
            timestamp: env.ledger().timestamp(),
        };
        let mut txs: Vec<TreasuryTx> = env
            .storage()
            .instance()
            .get(&DataKey::Transactions)
            .unwrap_or_else(|| Vec::new(&env));
        txs.push_back(tx);
        env.storage().instance().set(&DataKey::Transactions, &txs);

        env.events()
            .publish((symbol_short!("DEPOSIT"),), (from, amount));
    }

    /// Withdraw from treasury. Only admin or voting contract.
    pub fn withdraw(env: Env, caller: Address, to: Address, amount: i128) {
        caller.require_auth();
        assert!(amount > 0, "amount must be positive");
        let mut config: TreasuryConfig =
            env.storage().instance().get(&DataKey::Config).unwrap();
        assert!(
            caller == config.admin || caller == config.voting_contract,
            "unauthorized"
        );

        let token = TokenClient::new(&env, &config.token);
        let bal = token.balance(&env.current_contract_address());
        assert!(bal >= amount, "insufficient treasury balance");
        token.transfer(&env.current_contract_address(), &to, &amount);

        config.total_withdrawn += amount;
        env.storage().instance().set(&DataKey::Config, &config);

        let tx = TreasuryTx {
            kind: TxKind::Withdraw,
            from_or_to: to.clone(),
            amount,
            ledger: env.ledger().sequence(),
            timestamp: env.ledger().timestamp(),
        };
        let mut txs: Vec<TreasuryTx> = env
            .storage()
            .instance()
            .get(&DataKey::Transactions)
            .unwrap_or_else(|| Vec::new(&env));
        txs.push_back(tx);
        env.storage().instance().set(&DataKey::Transactions, &txs);

        env.events()
            .publish((symbol_short!("WITHDRAW"),), (to, amount));
    }

    pub fn get_balance(env: Env) -> i128 {
        let config: TreasuryConfig =
            env.storage().instance().get(&DataKey::Config).unwrap();
        let token = TokenClient::new(&env, &config.token);
        token.balance(&env.current_contract_address())
    }

    pub fn get_config(env: Env) -> TreasuryConfig {
        env.storage().instance().get(&DataKey::Config).unwrap()
    }

    pub fn get_transactions(env: Env) -> Vec<TreasuryTx> {
        env.storage()
            .instance()
            .get(&DataKey::Transactions)
            .unwrap_or_else(|| Vec::new(&env))
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use governance_token::{GovernanceToken, GovernanceTokenClient};
    use soroban_sdk::{testutils::Address as _, Env, String};

    fn setup(env: &Env) -> (Address, GovernanceTokenClient, TreasuryContractClient) {
        let admin = Address::generate(env);
        let voting = Address::generate(env);
        let token_id = env.register(GovernanceToken, ());
        let treasury_id = env.register(TreasuryContract, ());

        let token = GovernanceTokenClient::new(env, &token_id);
        let treasury = TreasuryContractClient::new(env, &treasury_id);

        token.initialize(
            &admin,
            &String::from_str(env, "PollChain Governance"),
            &String::from_str(env, "POLL"),
            &7,
            &1_000_000_0000000,
        );
        treasury.initialize(&admin, &token_id, &voting);
        (admin, token, treasury)
    }

    #[test]
    fn test_deposit() {
        let env = Env::default();
        env.mock_all_auths();
        let (admin, _token, treasury) = setup(&env);
        treasury.deposit(&admin, &10000_0000000);
        assert_eq!(treasury.get_balance(), 10000_0000000);
    }

    #[test]
    fn test_withdraw_by_admin() {
        let env = Env::default();
        env.mock_all_auths();
        let (admin, token, treasury) = setup(&env);
        let recipient = Address::generate(&env);
        treasury.deposit(&admin, &10000_0000000);
        treasury.withdraw(&admin, &recipient, &5000_0000000);
        assert_eq!(token.balance(&recipient), 5000_0000000);
        assert_eq!(treasury.get_balance(), 5000_0000000);
    }

    #[test]
    #[should_panic(expected = "unauthorized")]
    fn test_unauthorized_withdraw_panics() {
        let env = Env::default();
        env.mock_all_auths();
        let (admin, _token, treasury) = setup(&env);
        let attacker = Address::generate(&env);
        treasury.deposit(&admin, &10000_0000000);
        treasury.withdraw(&attacker, &attacker, &5000_0000000);
    }

    #[test]
    fn test_transaction_log() {
        let env = Env::default();
        env.mock_all_auths();
        let (admin, _token, treasury) = setup(&env);
        treasury.deposit(&admin, &10000_0000000);
        let txs = treasury.get_transactions();
        assert_eq!(txs.len(), 1);
    }
}
