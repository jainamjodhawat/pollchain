// PollChain Contract Addresses (Testnet)
export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const RPC_URL = "https://soroban-testnet.stellar.org";

// Contract IDs — update after deployment
export const GOVERNANCE_TOKEN_CONTRACT_ID =
  import.meta.env.VITE_GOVERNANCE_TOKEN_CONTRACT_ID || "";
export const VOTING_CONTRACT_ID =
  import.meta.env.VITE_VOTING_CONTRACT_ID || "";
export const EXECUTION_CONTRACT_ID =
  import.meta.env.VITE_EXECUTION_CONTRACT_ID || "";

// Token config
export const TOKEN_DECIMALS = 7;
export const TOKEN_SYMBOL = "POLL";
export const TOKEN_NAME = "PollChain Governance";

// Voting config
export const PROPOSAL_THRESHOLD = 100 * 10 ** TOKEN_DECIMALS;
export const VOTING_PERIOD_LEDGERS = 17280;
export const QUORUM = 10 * 10 ** TOKEN_DECIMALS;
