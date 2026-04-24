//! PollChain Governance Token (POLL)
//! SEP-41 compliant fungible token used for voting weight in PollChain DAO.

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    token::Interface as TokenInterface,
    Address, Env, String, Symbol,
};

mod storage_types {
    use soroban_sdk::contracttype;

    #[contracttype]
    pub enum DataKey {
        Allowance(AllowanceDataKey),
        Balance(soroban_sdk::Address),
        Nonce(soroban_sdk::Address),
        State,
        Admin,
    }

    #[contracttype]
    pub struct AllowanceDataKey {
        pub from: soroban_sdk::Address,
        pub spender: soroban_sdk::Address,
    }

    #[contracttype]
    pub struct AllowanceValue {
        pub amount: i128,
        pub expiration_ledger: u32,
    }

    #[contracttype]
    pub struct TokenState {
        pub name: soroban_sdk::String,
        pub symbol: soroban_sdk::String,
        pub decimals: u32,
        pub total_supply: i128,
    }
}

use storage_types::*;

fn get_balance(env: &Env, addr: &Address) -> i128 {
    env.storage()
        .persistent()
        .get(&DataKey::Balance(addr.clone()))
        .unwrap_or(0)
}

fn set_balance(env: &Env, addr: &Address, amount: i128) {
    env.storage()
        .persistent()
        .set(&DataKey::Balance(addr.clone()), &amount);
}

fn get_admin(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&DataKey::Admin)
        .unwrap()
}

fn get_state(env: &Env) -> TokenState {
    env.storage().instance().get(&DataKey::State).unwrap()
}

fn set_state(env: &Env, state: &TokenState) {
    env.storage().instance().set(&DataKey::State, state);
}

#[contract]
pub struct GovernanceToken;

#[contractimpl]
impl GovernanceToken {
    /// Initialize the governance token.
    pub fn initialize(
        env: Env,
        admin: Address,
        name: String,
        symbol: String,
        decimals: u32,
        initial_supply: i128,
    ) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        let state = TokenState {
            name,
            symbol,
            decimals,
            total_supply: initial_supply,
        };
        set_state(&env, &state);
        set_balance(&env, &admin, initial_supply);
        env.events().publish(
            (symbol_short!("MINT"),),
            (admin, initial_supply),
        );
    }

    /// Mint new tokens to an address. Admin only.
    pub fn mint(env: Env, to: Address, amount: i128) {
        let admin = get_admin(&env);
        admin.require_auth();
        assert!(amount > 0, "amount must be positive");
        let mut state = get_state(&env);
        state.total_supply += amount;
        set_state(&env, &state);
        let bal = get_balance(&env, &to);
        set_balance(&env, &to, bal + amount);
        env.events().publish((symbol_short!("MINT"),), (to, amount));
    }

    /// Burn tokens from an address. Admin only (for governance slashing).
    pub fn burn_from_admin(env: Env, from: Address, amount: i128) {
        let admin = get_admin(&env);
        admin.require_auth();
        assert!(amount > 0, "amount must be positive");
        let bal = get_balance(&env, &from);
        assert!(bal >= amount, "insufficient balance");
        let mut state = get_state(&env);
        state.total_supply -= amount;
        set_state(&env, &state);
        set_balance(&env, &from, bal - amount);
        env.events().publish((symbol_short!("BURN"),), (from, amount));
    }

    /// Get total supply.
    pub fn total_supply(env: Env) -> i128 {
        get_state(&env).total_supply
    }

    /// Get admin address.
    pub fn admin(env: Env) -> Address {
        get_admin(&env)
    }

    /// Transfer admin role.
    pub fn set_admin(env: Env, new_admin: Address) {
        let admin = get_admin(&env);
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &new_admin);
    }
}

#[contractimpl]
impl TokenInterface for GovernanceToken {
    fn allowance(env: Env, from: Address, spender: Address) -> i128 {
        let key = DataKey::Allowance(AllowanceDataKey {
            from: from.clone(),
            spender: spender.clone(),
        });
        let val: Option<AllowanceValue> = env.storage().temporary().get(&key);
        match val {
            Some(v) => {
                if env.ledger().sequence() > v.expiration_ledger {
                    0
                } else {
                    v.amount
                }
            }
            None => 0,
        }
    }

    fn approve(env: Env, from: Address, spender: Address, amount: i128, expiration_ledger: u32) {
        from.require_auth();
        assert!(
            expiration_ledger >= env.ledger().sequence(),
            "expiration must be in the future"
        );
        let key = DataKey::Allowance(AllowanceDataKey {
            from: from.clone(),
            spender: spender.clone(),
        });
        env.storage().temporary().set(
            &key,
            &AllowanceValue {
                amount,
                expiration_ledger,
            },
        );
        env.storage()
            .temporary()
            .extend_ttl(&key, expiration_ledger, expiration_ledger);
        env.events()
            .publish((Symbol::new(&env, "approve"),), (from, spender, amount, expiration_ledger));
    }

    fn balance(env: Env, id: Address) -> i128 {
        get_balance(&env, &id)
    }

    fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();
        assert!(amount > 0, "amount must be positive");
        let from_bal = get_balance(&env, &from);
        assert!(from_bal >= amount, "insufficient balance");
        set_balance(&env, &from, from_bal - amount);
        let to_bal = get_balance(&env, &to);
        set_balance(&env, &to, to_bal + amount);
        env.events()
            .publish((Symbol::new(&env, "transfer"),), (from, to, amount));
    }

    fn transfer_from(env: Env, spender: Address, from: Address, to: Address, amount: i128) {
        spender.require_auth();
        let key = DataKey::Allowance(AllowanceDataKey {
            from: from.clone(),
            spender: spender.clone(),
        });
        let allowance_val: AllowanceValue = env
            .storage()
            .temporary()
            .get(&key)
            .expect("no allowance");
        assert!(
            env.ledger().sequence() <= allowance_val.expiration_ledger,
            "allowance expired"
        );
        assert!(allowance_val.amount >= amount, "insufficient allowance");
        let new_allowance = AllowanceValue {
            amount: allowance_val.amount - amount,
            expiration_ledger: allowance_val.expiration_ledger,
        };
        env.storage().temporary().set(&key, &new_allowance);
        let from_bal = get_balance(&env, &from);
        assert!(from_bal >= amount, "insufficient balance");
        set_balance(&env, &from, from_bal - amount);
        let to_bal = get_balance(&env, &to);
        set_balance(&env, &to, to_bal + amount);
        env.events()
            .publish((Symbol::new(&env, "transfer"),), (from, to, amount));
    }

    fn burn(env: Env, from: Address, amount: i128) {
        from.require_auth();
        assert!(amount > 0, "amount must be positive");
        let bal = get_balance(&env, &from);
        assert!(bal >= amount, "insufficient balance");
        let mut state = get_state(&env);
        state.total_supply -= amount;
        set_state(&env, &state);
        set_balance(&env, &from, bal - amount);
        env.events()
            .publish((Symbol::new(&env, "burn"),), (from, amount));
    }

    fn burn_from(env: Env, spender: Address, from: Address, amount: i128) {
        spender.require_auth();
        let key = DataKey::Allowance(AllowanceDataKey {
            from: from.clone(),
            spender: spender.clone(),
        });
        let allowance_val: AllowanceValue = env
            .storage()
            .temporary()
            .get(&key)
            .expect("no allowance");
        assert!(
            env.ledger().sequence() <= allowance_val.expiration_ledger,
            "allowance expired"
        );
        assert!(allowance_val.amount >= amount, "insufficient allowance");
        let new_allowance = AllowanceValue {
            amount: allowance_val.amount - amount,
            expiration_ledger: allowance_val.expiration_ledger,
        };
        env.storage().temporary().set(&key, &new_allowance);
        let bal = get_balance(&env, &from);
        assert!(bal >= amount, "insufficient balance");
        let mut state = get_state(&env);
        state.total_supply -= amount;
        set_state(&env, &state);
        set_balance(&env, &from, bal - amount);
        env.events()
            .publish((Symbol::new(&env, "burn"),), (from, amount));
    }

    fn decimals(env: Env) -> u32 {
        get_state(&env).decimals
    }

    fn name(env: Env) -> String {
        get_state(&env).name
    }

    fn symbol(env: Env) -> String {
        get_state(&env).symbol
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    #[test]
    fn test_initialize_and_balance() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(GovernanceToken, ());
        let client = GovernanceTokenClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        client.initialize(
            &admin,
            &String::from_str(&env, "PollChain Governance"),
            &String::from_str(&env, "POLL"),
            &7,
            &1_000_000_0000000,
        );
        assert_eq!(client.balance(&admin), 1_000_000_0000000);
        assert_eq!(client.total_supply(), 1_000_000_0000000);
        assert_eq!(client.decimals(), 7);
    }

    #[test]
    fn test_mint() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(GovernanceToken, ());
        let client = GovernanceTokenClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        client.initialize(
            &admin,
            &String::from_str(&env, "PollChain Governance"),
            &String::from_str(&env, "POLL"),
            &7,
            &0,
        );
        client.mint(&user, &500_0000000);
        assert_eq!(client.balance(&user), 500_0000000);
        assert_eq!(client.total_supply(), 500_0000000);
    }

    #[test]
    fn test_transfer() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(GovernanceToken, ());
        let client = GovernanceTokenClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        client.initialize(
            &admin,
            &String::from_str(&env, "PollChain Governance"),
            &String::from_str(&env, "POLL"),
            &7,
            &1000_0000000,
        );
        client.transfer(&admin, &user, &100_0000000);
        assert_eq!(client.balance(&admin), 900_0000000);
        assert_eq!(client.balance(&user), 100_0000000);
    }

    #[test]
    fn test_burn() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(GovernanceToken, ());
        let client = GovernanceTokenClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        client.initialize(
            &admin,
            &String::from_str(&env, "PollChain Governance"),
            &String::from_str(&env, "POLL"),
            &7,
            &1000_0000000,
        );
        client.burn(&admin, &200_0000000);
        assert_eq!(client.balance(&admin), 800_0000000);
        assert_eq!(client.total_supply(), 800_0000000);
    }
}
