# PollChain Architecture

PollChain is a React/Vite governance client backed by six Soroban contracts on
Stellar Testnet. The browser never receives or stores a secret key. Freighter
authorizes writes, while public reads use Stellar RPC simulation.

## Runtime flow

```text
React route
  -> page hook or event handler
  -> frontend/src/utils/contracts.ts
  -> frontend/src/integrations/sorobanClient.ts
     -> read: Stellar RPC simulateTransaction
     -> write: simulate -> Freighter sign -> sendTransaction -> confirmation
  -> Soroban contract
     -> governance token
     -> voting
     -> execution
     -> faucet
     -> treasury
     -> delegation
```

## Frontend-to-contract function map

The `npm run verify:contracts` command checks each mapping against the Rust and
TypeScript sources and fails when either side is missing.

| Contract | Soroban function | Frontend wrapper |
|---|---|---|
| Voting | `proposal_count` | `fetchProposalCount` |
| Voting | `get_proposal` | `fetchProposal` |
| Voting | `get_proposals` | `fetchProposals` |
| Voting | `get_vote` | `fetchVote` |
| Voting | `get_config` | `fetchVotingConfig` |
| Voting | `create_proposal` | `createProposal` |
| Voting | `vote` | `castVote` |
| Voting | `finalize` | `finalizeProposal` |
| Governance token | `balance` | `fetchTokenBalance` |
| Governance token | `total_supply` | `fetchTotalSupply` |
| Faucet | `get_config` | `fetchFaucetConfig` |
| Faucet | `get_last_claim` | `fetchLastClaim` |
| Faucet | `get_reserve` | `fetchFaucetReserve` |
| Faucet | `claim` | `claimFaucet` |
| Treasury | `get_balance` | `fetchTreasuryBalance` |
| Treasury | `get_transactions` | `fetchTreasuryTxs` |
| Treasury | `deposit` | `depositTreasury` |
| Delegation | `get_delegate` | `fetchDelegate` |
| Delegation | `get_delegators` | `fetchDelegators` |
| Delegation | `get_voting_power` | `fetchVotingPower` |
| Delegation | `delegate` | `delegateTo` |
| Delegation | `undelegate` | `undelegateVotes` |

## Contract responsibilities

| Contract | Responsibility |
|---|---|
| Governance token | SEP-41 POLL balances, allowances, minting and burning |
| Voting | Proposal lifecycle, quorum, weighted/quadratic voting and rewards |
| Execution | Records approved execution and calls the treasury when required |
| Faucet | Testnet onboarding through cooldown-controlled POLL claims |
| Treasury | Community deposits, authorized withdrawals and transaction history |
| Delegation | Delegation relationships and effective voting-power calculation |

## Safety boundaries

- Freighter handles authorization and signing; PollChain only receives the
  signed transaction envelope.
- Every write is simulated before the wallet signs it.
- A write is only shown as successful after RPC confirms the transaction.
- Contract IDs are supplied through Vite environment variables and validated
  by the integration cross-check.
- The global React error boundary provides a recoverable failure state.
- Analytics and performance monitoring are disabled by default and load only
  when `VITE_ENABLE_ANALYTICS=true` and the visitor explicitly consents.

## Delivery architecture

- `.github/workflows/ci.yml` runs contract tests, strict Clippy, release WASM
  builds, frontend lint/type/build, the cross-contract map, and dependency
  audits.
- `.github/workflows/deployment-validation.yml` checks `/`, `/proposals`, and
  `/about` after a successful deployment or manual dispatch.
- `vercel.json` and `frontend/vercel.json` preserve SPA deep-link routing for
  either supported Vercel root-directory configuration.
