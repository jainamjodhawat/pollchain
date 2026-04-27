# PollChain — Gasless On-Chain DAO Governance

> Built on Stellar & Soroban | Stellar Journey to Mastery — Level 4 & 5

PollChain is a lightweight governance platform that lets any community create proposals, vote with POLL tokens, and automatically execute decisions on-chain — all for fractions of a cent on Stellar.

## 🌐 Live Demo

**[dist-six-psi-56.vercel.app](https://dist-six-psi-56.vercel.app)**

## 🎥 Demo Video

[▶ Watch Demo on Google Drive](https://drive.google.com/file/d/15bN3Q3Ho2Wd_1nERBiSsWyTZvWUEAMKx/view?usp=sharing)

## Screenshots

<img width="1456" alt="Home" src="https://github.com/user-attachments/assets/9adb012f-ba95-432e-9e66-b8f250724c91" />
<img width="1458" alt="Proposals" src="https://github.com/user-attachments/assets/04a8f906-75a7-4400-b4c3-c7e644fc9850" />
<img width="1452" alt="Proposal Detail" src="https://github.com/user-attachments/assets/e7492aa1-f349-4442-8176-6d14693bd867" />
<img width="1453" alt="Create Proposal" src="https://github.com/user-attachments/assets/d16a1d0d-2eb0-4535-85f3-ac81936bc98e" />
<img width="1455" alt="Dashboard" src="https://github.com/user-attachments/assets/edcfdb39-6101-4f54-baba-2e81a5328160" />
<img width="1457" alt="Faucet" src="https://github.com/user-attachments/assets/2137c5ef-00f6-473f-a5c1-cce84888a34d" />
<img width="1451" alt="Treasury" src="https://github.com/user-attachments/assets/c989441a-c000-4516-9765-c5e08ba93ec3" />

**Mobile:**
<img width="356" alt="Mobile Home" src="https://github.com/user-attachments/assets/b149a6dd-07bc-4b4c-af79-38f117a23824" />
<img width="350" alt="Mobile Proposals" src="https://github.com/user-attachments/assets/69573962-d87c-4147-9cf4-f5e06fddd3d8" />
<img width="356" alt="Mobile Menu" src="https://github.com/user-attachments/assets/27e4a19d-a9d8-4645-be06-8c5c1b9e8979" />

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

## Level 4 (Green Belt) Checklist

- [x] Custom SEP-41 POLL governance token
- [x] Inter-contract call: Voting → Execution on proposal pass
- [x] CI/CD pipeline (GitHub Actions — contracts + frontend + security audit)
- [x] Mobile-responsive frontend
- [x] 26 contract tests across 6 contracts

## Level 5 (Blue Belt) Checklist

- [x] Shipped real MVP deployed on Stellar Testnet
- [x] Live frontend deployed on Vercel
- [x] 5+ active users onboarded (claimed POLL, created proposals, voted)
- [x] Faucet contract — users can self-onboard without admin
- [x] Treasury contract — community-owned fund
- [x] Delegation contract — advanced governance feature
- [x] Dashboard — personal activity view per wallet
- [x] Demo video recorded and linked
- [x] User feedback collected and fixed (4 issues resolved with commit references)
- [x] README with full documentation, screenshots, and contract addresses

---

## User Feedback & Fixes

| # | User Feedback | Status | Fix Commit |
|---|---|---|---|
| 1 | "When I vote I don't see the percentage of vote change instantly" | ✅ Fixed | [`c9b6450`](https://github.com/jainamjodhawat/pollchain/commit/c9b6450) |
| 2 | "My proposal is not visible — I would like a new tab to view my proposals" | ✅ Fixed | [`31a3f99`](https://github.com/jainamjodhawat/pollchain/commit/31a3f99) |
| 3 | "Remove all the hardcoded stuff, it creates confusion" | ✅ Fixed | [`562d00c`](https://github.com/jainamjodhawat/pollchain/commit/562d00c) |
| 4 | "There should be an option to disconnect wallet" | ✅ Fixed | [`87d6cec`](https://github.com/jainamjodhawat/pollchain/commit/87d6cec) |

---

## License

MIT
