//! PollChain Faucet Contract
//! Lets anyone claim POLL tokens once per cooldown period.
//! The faucet holds a POLL reserve (funded by admin) and transfers from it.

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, contractclient, symbol_short,
    token::Client as TokenClient,
    Address, Env,
};

#[contracttype]
pub enum DataKey {
    Config,
    LastClaim(Address),
}

#[contracttype]
#[derive(Clone)]
pub struct FaucetConfig {
    pub admin: Address,
    pub token: Address,
    pub claim_amount: i128,
    /// Ledgers between claims (~5s each; 17280 ≈ 1 day)
    pub cooldown_ledgers: u32,
    pub total_claimed: i128,
    pub total_claimants: u64,
}

#[contract]
pub struct FaucetContract;

#[contractimpl]
impl FaucetContract {
    pub fn initialize(
        env: Env,
        admin: Address,
        token: Address,
        claim_amount: i128,
        cooldown_ledgers: u32,
    ) {
        if env.storage().instance().has(&DataKey::Config) {
            panic!("already initialized");
        }
        let config = FaucetConfig {
            admin,
            token,
            claim_amount,
            cooldown_ledgers,
            total_claimed: 0,
            total_claimants: 0,
        };
        env.storage().instance().set(&DataKey::Config, &config);
    }

    /// Fund the faucet reserve — admin sends POLL to this contract address.
    pub fn fund(env: Env, from: Address, amount: i128) {
        from.require_auth();
        let config: FaucetConfig =
            env.storage().instance().get(&DataKey::Config).unwrap();
        let token = TokenClient::new(&env, &config.token);
        token.transfer(&from, &env.current_contract_address(), &amount);
        env.events().publish((symbol_short!("FUND"),), (from, amount));
    }

    /// Claim POLL tokens. Enforces cooldown per address.
    pub fn claim(env: Env, claimant: Address) {
        claimant.require_auth();
        let mut config: FaucetConfig =
            env.storage().instance().get(&DataKey::Config).unwrap();

        let current_ledger = env.ledger().sequence();
        let key = DataKey::LastClaim(claimant.clone());

        let is_new = env
            .storage()
            .persistent()
            .get::<DataKey, u32>(&key)
            .is_none();

        if !is_new {
            let last: u32 = env.storage().persistent().get(&key).unwrap();
            let elapsed = current_ledger.saturating_sub(last);
            assert!(elapsed >= config.cooldown_ledgers, "cooldown not met");
        }

        // Transfer from faucet reserve to claimant
        let token = TokenClient::new(&env, &config.token);
        let reserve = token.balance(&env.current_contract_address());
        assert!(reserve >= config.claim_amount, "faucet empty");
        token.transfer(&env.current_contract_address(), &claimant, &config.claim_amount);

        env.storage().persistent().set(&key, &current_ledger);

        config.total_claimed += config.claim_amount;
        if is_new {
            config.total_claimants += 1;
        }
        env.storage().instance().set(&DataKey::Config, &config);

        env.events().publish(
            (symbol_short!("CLAIM"),),
            (claimant, config.claim_amount),
        );
    }

    pub fn get_last_claim(env: Env, address: Address) -> Option<u32> {
        env.storage()
            .persistent()
            .get(&DataKey::LastClaim(address))
    }

    pub fn get_config(env: Env) -> FaucetConfig {
        env.storage().instance().get(&DataKey::Config).unwrap()
    }

    pub fn get_reserve(env: Env) -> i128 {
        let config: FaucetConfig =
            env.storage().instance().get(&DataKey::Config).unwrap();
        let token = TokenClient::new(&env, &config.token);
        token.balance(&env.current_contract_address())
    }

    pub fn set_claim_amount(env: Env, amount: i128) {
        let mut config: FaucetConfig =
            env.storage().instance().get(&DataKey::Config).unwrap();
        config.admin.require_auth();
        config.claim_amount = amount;
        env.storage().instance().set(&DataKey::Config, &config);
    }

    pub fn set_cooldown(env: Env, cooldown_ledgers: u32) {
        let mut config: FaucetConfig =
            env.storage().instance().get(&DataKey::Config).unwrap();
        config.admin.require_auth();
        config.cooldown_ledgers = cooldown_ledgers;
        env.storage().instance().set(&DataKey::Config, &config);
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use governance_token::{GovernanceToken, GovernanceTokenClient};
    use soroban_sdk::{testutils::{Address as _, Ledger as _}, Env, String};

    fn setup(env: &Env) -> (Address, GovernanceTokenClient, FaucetContractClient) {
        let admin = Address::generate(env);
        let token_id = env.register(GovernanceToken, ());
        let faucet_id = env.register(FaucetContract, ());

        let token = GovernanceTokenClient::new(env, &token_id);
        let faucet = FaucetContractClient::new(env, &faucet_id);

        token.initialize(
            &admin,
            &String::from_str(env, "PollChain Governance"),
            &String::from_str(env, "POLL"),
            &7,
            &100_000_0000000,
        );

        faucet.initialize(&admin, &token_id, &1000_0000000, &100);
        // Fund the faucet with 50,000 POLL
        faucet.fund(&admin, &50_000_0000000);
        (admin, token, faucet)
    }

    #[test]
    fn test_claim_works() {
        let env = Env::default();
        env.mock_all_auths();
        let (_admin, token, faucet) = setup(&env);
        let user = Address::generate(&env);

        faucet.claim(&user);
        assert_eq!(token.balance(&user), 1000_0000000);
        assert!(faucet.get_last_claim(&user).is_some());
    }

    #[test]
    #[should_panic(expected = "cooldown not met")]
    fn test_double_claim_panics() {
        let env = Env::default();
        env.mock_all_auths();
        let (_admin, _token, faucet) = setup(&env);
        let user = Address::generate(&env);

        faucet.claim(&user);
        faucet.claim(&user);
    }

    #[test]
    fn test_claim_after_cooldown() {
        let env = Env::default();
        env.mock_all_auths();
        let (_admin, token, faucet) = setup(&env);
        let user = Address::generate(&env);

        faucet.claim(&user);
        env.ledger().with_mut(|l| l.sequence_number += 101);
        faucet.claim(&user);
        assert_eq!(token.balance(&user), 2000_0000000);
    }

    #[test]
    fn test_set_claim_amount() {
        let env = Env::default();
        env.mock_all_auths();
        let (_admin, _token, faucet) = setup(&env);
        faucet.set_claim_amount(&500_0000000);
        assert_eq!(faucet.get_config().claim_amount, 500_0000000);
    }

    #[test]
    fn test_reserve_balance() {
        let env = Env::default();
        env.mock_all_auths();
        let (_admin, _token, faucet) = setup(&env);
        assert_eq!(faucet.get_reserve(), 50_000_0000000);
    }
}
