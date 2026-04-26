# PollChain — Gasless On-Chain DAO Governance

> Built on Stellar & Soroban | Stellar Journey to Mastery — Level 4 & 5

PollChain is a lightweight governance platform that lets any community create proposals, vote with POLL tokens, and automatically execute decisions on-chain — all for fractions of a cent on Stellar.

## Live Demo

🌐 [dist-six-psi-56.vercel.app](https://dist-six-psi-56.vercel.app)

## Features

- 🗳️ **Create Proposals** — Any holder of 100+ POLL tokens can submit a governance proposal
- ⚡ **Token-Weighted Voting** — Vote Yes / No / Abstain; weight = your POLL balance
- 🔗 **Inter-Contract Execution** — Voting contract calls Execution contract on-chain when a proposal passes
- 🪙 **Custom SEP-41 Token** — POLL governance token with mint, burn, transfer, allowance
- 🛡️ **Quorum Protection** — Proposals require minimum participation to be valid
- 📱 **Mobile Responsive** — Works on all screen sizes
- 🔄 **CI/CD** — GitHub Actions runs tests, builds, and security audits on every push

## Smart Contracts

| Contract | Contract ID | Stellar Expert |
|---|---|---|
| `governance_token` | `CDMDAQ3WHWL3APQMDX2ATFX3DDO63RT75QHCH44WZVZDLDWMOTBIWNFF` | [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CDMDAQ3WHWL3APQMDX2ATFX3DDO63RT75QHCH44WZVZDLDWMOTBIWNFF) |
| `voting` | `CBINGSMC4YVN4YIDGAUMSEHVUP3DMDI7X56EMYATNTNQKEMXHVTQVTNN` | [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CBINGSMC4YVN4YIDGAUMSEHVUP3DMDI7X56EMYATNTNQKEMXHVTQVTNN) |
| `execution` | `CCWGLLESMFOAKZXF6DAGA6PYTNEFI2HCR3PGNMMSUHFGYJJDBSSWAKCP` | [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CCWGLLESMFOAKZXF6DAGA6PYTNEFI2HCR3PGNMMSUHFGYJJDBSSWAKCP) |

> Network: **Stellar Testnet** | Deployed by: `GC5HL2KXTCEXGZU4N6QIDQLIXW6HSFYEZV7ELAEEHDL4EHUMVSTZCPX6`

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

## User Feedback & Fixes

Issues reported by users during testing, and the commits in which they were resolved.

| # | User Feedback | Status | Fix Commit |
|---|---|---|---|
| 1 | "When I vote I don't see the percentage of vote change instantly" | ✅ Fixed | [`c9b6450`](https://github.com/jainamjodhawat/pollchain/commit/c9b6450) |
| 2 | "My proposal is not visible — I would like a new tab to view my proposals" | ✅ Fixed | [`31a3f99`](https://github.com/jainamjodhawat/pollchain/commit/31a3f99) |
| 3 | "Remove all the hardcoded stuff, it creates confusion" | ✅ Fixed | [`562d00c`](https://github.com/jainamjodhawat/pollchain/commit/562d00c) |
| 4 | "There should be an option to disconnect wallet" | ✅ Fixed | [`87d6cec`](https://github.com/jainamjodhawat/pollchain/commit/87d6cec) |


demo video drive link- https://drive.google.com/file/d/15bN3Q3Ho2Wd_1nERBiSsWyTZvWUEAMKx/view?usp=sharing
screenshots
<img width="1456" height="864" alt="Screenshot 2026-04-25 at 8 19 06 AM" src="https://github.com/user-attachments/assets/9adb012f-ba95-432e-9e66-b8f250724c91" />
<img width="1458" height="864" alt="Screenshot 2026-04-25 at 8 19 20 AM" src="https://github.com/user-attachments/assets/04a8f906-75a7-4400-b4c3-c7e644fc9850" />
<img width="1452" height="864" alt="Screenshot 2026-04-25 at 8 17 58 AM" src="https://github.com/user-attachments/assets/e7492aa1-f349-4442-8176-6d14693bd867" />
<img width="1453" height="865" alt="Screenshot 2026-04-25 at 8 18 11 AM" src="https://github.com/user-attachments/assets/d16a1d0d-2eb0-4535-85f3-ac81936bc98e" />
<img width="1455" height="862" alt="Screenshot 2026-04-25 at 8 18 27 AM" src="https://github.com/user-attachments/assets/edcfdb39-6101-4f54-baba-2e81a5328160" />
<img width="1457" height="863" alt="Screenshot 2026-04-25 at 8 18 52 AM" src="https://github.com/user-attachments/assets/2137c5ef-00f6-473f-a5c1-cce84888a34d" />
<img width="1451" height="855" alt="Screenshot 2026-04-25 at 8 19 03 AM" src="https://github.com/user-attachments/assets/c989441a-c000-4516-9765-c5e08ba93ec3" />
mobile viewing experience-
<img width="356" height="772" alt="Screenshot 2026-04-25 at 8 19 38 AM" src="https://github.com/user-attachments/assets/b149a6dd-07bc-4b4c-af79-38f117a23824" />
<img width="350" height="767" alt="Screenshot 2026-04-25 at 8 19 49 AM" src="https://github.com/user-attachments/assets/69573962-d87c-4147-9cf4-f5e06fddd3d8" />
<img width="356" height="774" alt="Screenshot 2026-04-25 at 8 20 02 AM" src="https://github.com/user-attachments/assets/27e4a19d-a9d8-4645-be06-8c5c1b9e8979" />


## License

MIT
