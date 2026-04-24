# PollChain — Gasless On-Chain DAO Governance

> Built on Stellar & Soroban | Stellar Journey to Mastery — Level 4 & 5

PollChain is a lightweight governance platform that lets any community create proposals, vote with POLL tokens, and automatically execute decisions on-chain — all for fractions of a cent on Stellar.

## Live Demo

🌐 [pollchain.vercel.app](https://pollchain.vercel.app)

## Features

- 🗳️ **Create Proposals** — Any holder of 100+ POLL tokens can submit a governance proposal
- ⚡ **Token-Weighted Voting** — Vote Yes / No / Abstain; weight = your POLL balance
- 🔗 **Inter-Contract Execution** — Voting contract calls Execution contract on-chain when a proposal passes
- 🪙 **Custom SEP-41 Token** — POLL governance token with mint, burn, transfer, allowance
- 🛡️ **Quorum Protection** — Proposals require minimum participation to be valid
- 📱 **Mobile Responsive** — Works on all screen sizes
- 🔄 **CI/CD** — GitHub Actions runs tests, builds, and security audits on every push

## Smart Contracts

| Contract | Description |
|---|---|
| `governance_token` | SEP-41 POLL token — voting power |
| `voting` | Proposal creation, voting, finalization |
| `execution` | Called via inter-contract call when proposals pass |

### Architecture

```
User → Voting Contract → (on pass) → Execution Contract
              ↑
       Governance Token (balance = voting weight)
```

## Tech Stack

- **Smart Contracts**: Rust + Soroban SDK v22
- **Blockchain**: Stellar Testnet
- **Frontend**: React + TypeScript + Vite
- **Wallet**: Freighter (SEP-7)
- **CI/CD**: GitHub Actions
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Rust + `wasm32-unknown-unknown` target
- Node.js 20+
- [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools/cli/stellar-cli)
- [Freighter Wallet](https://freighter.app)

### Run Contract Tests

```bash
cargo test --workspace
```

### Build Contracts

```bash
cargo build --workspace --target wasm32-unknown-unknown --release
```

### Run Frontend

```bash
cd frontend
npm install
npm run dev
```

### Deploy Contracts to Testnet

```bash
# Fund a testnet account
stellar keys generate --global deployer --network testnet --fund

# Deploy governance token
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/governance_token.wasm \
  --source deployer \
  --network testnet

# Deploy execution contract
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/execution.wasm \
  --source deployer \
  --network testnet

# Deploy voting contract
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/voting.wasm \
  --source deployer \
  --network testnet
```

### Environment Variables

Copy `frontend/.env.example` to `frontend/.env` and fill in your deployed contract IDs:

```env
VITE_GOVERNANCE_TOKEN_CONTRACT_ID=C...
VITE_VOTING_CONTRACT_ID=C...
VITE_EXECUTION_CONTRACT_ID=C...
```

## Contract Tests

```
governance_token: 4 tests — initialize, mint, transfer, burn
voting:           6 tests — create, vote+pass, vote+fail, double-vote, cancel, quorum
execution:        3 tests — initialize, execute, double-init
```

All 13 tests pass ✅

## Level 4 (Green Belt) Checklist

- [x] Custom SEP-41 governance token (POLL)
- [x] Inter-contract call: Voting → Execution on proposal pass
- [x] CI/CD pipeline (GitHub Actions)
- [x] Mobile-responsive frontend
- [x] Comprehensive test suite (13 tests)

## Level 5 (Purple Belt) Roadmap

- [ ] Deploy to mainnet
- [ ] Onboard 20+ active community members
- [ ] Add delegation (vote on behalf of others)
- [ ] Treasury contract integration
- [ ] Security audit via Stellar Audit Bank
- [ ] Demo Day presentation

## License

MIT
