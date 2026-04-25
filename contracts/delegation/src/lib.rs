//! PollChain Delegation Contract
//! Allows token holders to delegate their voting power to another address.

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    token::Client as TokenClient,
    Address, Env, Vec,
};

#[contracttype]
pub enum DataKey {
    Config,
    Delegate(Address),       // delegator -> delegatee
    DelegatedBy(Address),    // delegatee -> list of delegators
}

#[contracttype]
#[derive(Clone)]
pub struct DelegationConfig {
    pub admin: Address,
    pub token: Address,
}

#[contract]
pub struct DelegationContract;

#[contractimpl]
impl DelegationContract {
    pub fn initialize(env: Env, admin: Address, token: Address) {
        if env.storage().instance().has(&DataKey::Config) {
            panic!("already initialized");
        }
        env.storage()
            .instance()
            .set(&DataKey::Config, &DelegationConfig { admin, token });
    }

    /// Delegate voting power to another address.
    pub fn delegate(env: Env, delegator: Address, delegatee: Address) {
        delegator.require_auth();
        assert!(delegator != delegatee, "cannot delegate to self");

        // Remove any existing delegation first
        if let Some(old_delegatee) = env
            .storage()
            .persistent()
            .get::<DataKey, Address>(&DataKey::Delegate(delegator.clone()))
        {
            Self::remove_from_delegated_by(&env, &old_delegatee, &delegator);
        }

        env.storage()
            .persistent()
            .set(&DataKey::Delegate(delegator.clone()), &delegatee);

        // Add delegator to delegatee's list
        let mut list: Vec<Address> = env
            .storage()
            .persistent()
            .get(&DataKey::DelegatedBy(delegatee.clone()))
            .unwrap_or_else(|| Vec::new(&env));
        list.push_back(delegator.clone());
        env.storage()
            .persistent()
            .set(&DataKey::DelegatedBy(delegatee.clone()), &list);

        env.events()
            .publish((symbol_short!("DELEGATE"),), (delegator, delegatee));
    }

    /// Remove delegation.
    pub fn undelegate(env: Env, delegator: Address) {
        delegator.require_auth();
        if let Some(delegatee) = env
            .storage()
            .persistent()
            .get::<DataKey, Address>(&DataKey::Delegate(delegator.clone()))
        {
            Self::remove_from_delegated_by(&env, &delegatee, &delegator);
            env.storage()
                .persistent()
                .remove(&DataKey::Delegate(delegator.clone()));
            env.events()
                .publish((symbol_short!("UNDEL"),), (delegator,));
        }
    }

    /// Get who delegator has delegated to.
    pub fn get_delegate(env: Env, delegator: Address) -> Option<Address> {
        env.storage()
            .persistent()
            .get(&DataKey::Delegate(delegator))
    }

    /// Get all addresses that delegated to this delegatee.
    pub fn get_delegators(env: Env, delegatee: Address) -> Vec<Address> {
        env.storage()
            .persistent()
            .get(&DataKey::DelegatedBy(delegatee))
            .unwrap_or_else(|| Vec::new(&env))
    }

    /// Get effective voting power: own balance + sum of all delegators' balances.
    pub fn get_voting_power(env: Env, address: Address) -> i128 {
        let config: DelegationConfig =
            env.storage().instance().get(&DataKey::Config).unwrap();
        let token = TokenClient::new(&env, &config.token);

        let mut power = token.balance(&address);

        let delegators: Vec<Address> = env
            .storage()
            .persistent()
            .get(&DataKey::DelegatedBy(address.clone()))
            .unwrap_or_else(|| Vec::new(&env));

        for delegator in delegators.iter() {
            power += token.balance(&delegator);
        }
        power
    }

    fn remove_from_delegated_by(env: &Env, delegatee: &Address, delegator: &Address) {
        let mut list: Vec<Address> = env
            .storage()
            .persistent()
            .get(&DataKey::DelegatedBy(delegatee.clone()))
            .unwrap_or_else(|| Vec::new(env));
        let mut new_list = Vec::new(env);
        for addr in list.iter() {
            if addr != *delegator {
                new_list.push_back(addr);
            }
        }
        env.storage()
            .persistent()
            .set(&DataKey::DelegatedBy(delegatee.clone()), &new_list);
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use governance_token::{GovernanceToken, GovernanceTokenClient};
    use soroban_sdk::{testutils::Address as _, Env, String};

    fn setup(env: &Env) -> (Address, GovernanceTokenClient, DelegationContractClient) {
        let admin = Address::generate(env);
        let token_id = env.register(GovernanceToken, ());
        let del_id = env.register(DelegationContract, ());
        let token = GovernanceTokenClient::new(env, &token_id);
        let del = DelegationContractClient::new(env, &del_id);
        token.initialize(
            &admin,
            &String::from_str(env, "PollChain Governance"),
            &String::from_str(env, "POLL"),
            &7,
            &0,
        );
        del.initialize(&admin, &token_id);
        (admin, token, del)
    }

    #[test]
    fn test_delegate_and_get() {
        let env = Env::default();
        env.mock_all_auths();
        let (_admin, _token, del) = setup(&env);
        let a = Address::generate(&env);
        let b = Address::generate(&env);
        del.delegate(&a, &b);
        assert_eq!(del.get_delegate(&a), Some(b.clone()));
        assert_eq!(del.get_delegators(&b).len(), 1);
    }

    #[test]
    fn test_undelegate() {
        let env = Env::default();
        env.mock_all_auths();
        let (_admin, _token, del) = setup(&env);
        let a = Address::generate(&env);
        let b = Address::generate(&env);
        del.delegate(&a, &b);
        del.undelegate(&a);
        assert_eq!(del.get_delegate(&a), None);
        assert_eq!(del.get_delegators(&b).len(), 0);
    }

    #[test]
    fn test_voting_power() {
        let env = Env::default();
        env.mock_all_auths();
        let (admin, token, del) = setup(&env);
        let a = Address::generate(&env);
        let b = Address::generate(&env);
        token.mint(&a, &500_0000000);
        token.mint(&b, &300_0000000);
        del.delegate(&a, &b);
        // b's power = 300 (own) + 500 (delegated from a) = 800
        assert_eq!(del.get_voting_power(&b), 800_0000000);
    }

    #[test]
    #[should_panic(expected = "cannot delegate to self")]
    fn test_self_delegate_panics() {
        let env = Env::default();
        env.mock_all_auths();
        let (_admin, _token, del) = setup(&env);
        let a = Address::generate(&env);
        del.delegate(&a, &a);
    }
}
