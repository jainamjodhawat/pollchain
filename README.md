# PollChain — Gasless On-Chain DAO Governance

> Built on Stellar & Soroban | Stellar Journey to Mastery — Level 4 & 5

PollChain is a lightweight governance platform that lets any community create proposals, vote with POLL tokens, and automatically execute decisions on-chain — all for fractions of a cent on Stellar.

## 🌐 Live Demo

**[dist-six-psi-56.vercel.app](https://dist-six-psi-56.vercel.app)**

## 🎥 Demo Video

[▶ Watch Demo on Google Drive](https://drive.google.com/file/d/15bN3Q3Ho2Wd_1nERBiSsWyTZvWUEAMKx/view?usp=sharing)

## Screenshots
<img width="1274" height="872" alt="Screenshot 2026-04-29 at 10 54 08 PM" src="https://github.com/user-attachments/assets/78ffd8bb-ea0e-4da3-83b9-26eef988973c" />
<img width="1282" height="873" alt="Screenshot 2026-04-29 at 10 53 38 PM" src="https://github.com/user-attachments/assets/26f855d7-42e3-4456-90a6-7a27e6209305" />
<img width="1281" height="863" alt="Screenshot 2026-04-29 at 10 53 47 PM" src="https://github.com/user-attachments/assets/95d16f66-2a0b-4ee5-a2e3-1c1fd313a0bf" />
<img width="1273" height="875" alt="Screenshot 2026-04-29 at 10 53 54 PM" src="https://github.com/user-attachments/assets/153137ec-9366-4576-91c6-d3acbbadb2f4" />

**Mobile:**
<img width="359" height="769" alt="Screenshot 2026-04-29 at 10 54 35 PM" src="https://github.com/user-attachments/assets/5de72ea2-9c80-4bd0-8bac-afb64f98858b" />
<img width="356" height="766" alt="Screenshot 2026-04-29 at 10 54 43 PM" src="https://github.com/user-attachments/assets/2417f3ff-b5cc-46bd-9e55-fa7cdc63874f" />
<img width="348" height="766" alt="Screenshot 2026-04-29 at 10 54 54 PM" src="https://github.com/user-attachments/assets/5cdc3c0b-3d13-4974-b6e8-b822d14e124f" />

---

## Features

- 🗳️ **Create Proposals** — Any holder of 100+ POLL tokens can submit a governance proposal
- ⚡ **Token-Weighted Voting** — Vote Yes / No / Abstain; weight = your POLL balance
- 🔗 **Inter-Contract Execution** — Voting contract calls Execution contract on-chain when a proposal passes
- 🪙 **Custom SEP-41 Token** — POLL governance token with mint, burn, transfer, allowance
- 🛡️ **Quorum Protection** — Proposals require minimum participation to be valid
- 💧 **Token Faucet** — Claim 1,000 POLL/day to participate in governance
- 🏦 **DAO Treasury** — Community-owned POLL reserve, deposit open to all
- 🤝 **Vote Delegation** — Delegate your voting power to a trusted community member
- 📊 **Dashboard** — Personal view of your proposals, votes, and voting power
- 🏆 **Leaderboard** — Top governance participants ranked by activity
- 📱 **Mobile Responsive** — Full mobile navbar with slide-down drawer
- 🔄 **CI/CD** — GitHub Actions: contract tests, WASM build, TypeScript check, security audit

---

## Smart Contracts (Stellar Testnet)

| Contract | Contract ID | Stellar Expert |
|---|---|---|
| `governance_token` | `CDMDAQ3WHWL3APQMDX2ATFX3DDO63RT75QHCH44WZVZDLDWMOTBIWNFF` | [View](https://stellar.expert/explorer/testnet/contract/CDMDAQ3WHWL3APQMDX2ATFX3DDO63RT75QHCH44WZVZDLDWMOTBIWNFF) |
| `voting` | `CBINGSMC4YVN4YIDGAUMSEHVUP3DMDI7X56EMYATNTNQKEMXHVTQVTNN` | [View](https://stellar.expert/explorer/testnet/contract/CBINGSMC4YVN4YIDGAUMSEHVUP3DMDI7X56EMYATNTNQKEMXHVTQVTNN) |
| `execution` | `CCWGLLESMFOAKZXF6DAGA6PYTNEFI2HCR3PGNMMSUHFGYJJDBSSWAKCP` | [View](https://stellar.expert/explorer/testnet/contract/CCWGLLESMFOAKZXF6DAGA6PYTNEFI2HCR3PGNMMSUHFGYJJDBSSWAKCP) |
| `faucet` | `CAFOHPCXVEQC67AQM5I3HEOKQ2UMRQ5C5Q2U2XDJDOAMR36KUGVDY5BG` | [View](https://stellar.expert/explorer/testnet/contract/CAFOHPCXVEQC67AQM5I3HEOKQ2UMRQ5C5Q2U2XDJDOAMR36KUGVDY5BG) |
| `treasury` | `CDSSW6QXVLCCEYOF4MKK4MUINZ2Y24LEOQBVFROSHEQA6BE7C67VR5W5` | [View](https://stellar.expert/explorer/testnet/contract/CDSSW6QXVLCCEYOF4MKK4MUINZ2Y24LEOQBVFROSHEQA6BE7C67VR5W5) |
| `delegation` | `CAZ4STQXG7U6MXA5SNRYEFBISKT2NPOKHPEJBBLJUGTQGK2COQOMN34K` | [View](https://stellar.expert/explorer/testnet/contract/CAZ4STQXG7U6MXA5SNRYEFBISKT2NPOKHPEJBBLJUGTQGK2COQOMN34K) |

> Network: **Stellar Testnet** | Deployer: `GC5HL2KXTCEXGZU4N6QIDQLIXW6HSFYEZV7ELAEEHDL4EHUMVSTZCPX6`

### Architecture

```
User → Voting Contract → (on pass) → Execution Contract
              ↑                              ↓
       Governance Token              Treasury Contract
       (voting weight)
              ↑
       Faucet Contract (claim POLL)
       Delegation Contract (delegate voting power)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Rust + Soroban SDK v22 |
| Blockchain | Stellar Testnet |
| Frontend | React + TypeScript + Vite |
| Wallet | Freighter (SEP-7) |
| CI/CD | GitHub Actions |
| Hosting | Vercel |

---

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

### Environment Variables

Copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_GOVERNANCE_TOKEN_CONTRACT_ID=CDMDAQ3WHWL3APQMDX2ATFX3DDO63RT75QHCH44WZVZDLDWMOTBIWNFF
VITE_VOTING_CONTRACT_ID=CBINGSMC4YVN4YIDGAUMSEHVUP3DMDI7X56EMYATNTNQKEMXHVTQVTNN
VITE_EXECUTION_CONTRACT_ID=CCWGLLESMFOAKZXF6DAGA6PYTNEFI2HCR3PGNMMSUHFGYJJDBSSWAKCP
VITE_FAUCET_CONTRACT_ID=CAFOHPCXVEQC67AQM5I3HEOKQ2UMRQ5C5Q2U2XDJDOAMR36KUGVDY5BG
VITE_TREASURY_CONTRACT_ID=CDSSW6QXVLCCEYOF4MKK4MUINZ2Y24LEOQBVFROSHEQA6BE7C67VR5W5
VITE_DELEGATION_CONTRACT_ID=CAZ4STQXG7U6MXA5SNRYEFBISKT2NPOKHPEJBBLJUGTQGK2COQOMN34K
```

---

## Contract Tests

```
governance_token : 4 tests — initialize, mint, transfer, burn
voting           : 6 tests — create, vote+pass, vote+fail, double-vote, cancel, quorum
execution        : 3 tests — initialize, execute, double-init
faucet           : 5 tests — claim, double-claim, cooldown, set-amount, reserve
treasury         : 4 tests — deposit, withdraw-admin, unauthorized, tx-log
delegation       : 4 tests — delegate, undelegate, voting-power, self-delegate
```

**All 26 tests pass ✅**

---



## User Feedback & Fixes

google form link - https://forms.gle/8aS53MmL2ocw1V7bA
response sheet - https://docs.google.com/spreadsheets/d/1OpMTAgXctv9_4_mjb31TjOVvoZbm_1ernQJ_nc6H4sw/edit?usp=sharing

| # | User Feedback | Status | Fix Commit |
|---|---|---|---|
| 1 | "When I vote I don't see the percentage of vote change instantly" | ✅ Fixed | [`c9b6450`](https://github.com/jainamjodhawat/pollchain/commit/c9b6450) |
| 2 | "My proposal is not visible — I would like a new tab to view my proposals" | ✅ Fixed | [`31a3f99`](https://github.com/jainamjodhawat/pollchain/commit/31a3f99) |
| 3 | "Remove all the hardcoded stuff, it creates confusion" | ✅ Fixed | [`562d00c`](https://github.com/jainamjodhawat/pollchain/commit/562d00c) |
| 4 | "There should be an option to disconnect wallet" | ✅ Fixed | [`87d6cec`](https://github.com/jainamjodhawat/pollchain/commit/87d6cec) |

---

## License

MIT
