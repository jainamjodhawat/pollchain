# PollChain — Gasless On-Chain DAO Governance

> Built on Stellar & Soroban | Stellar Journey to Mastery — Level 4 & 5

[![PollChain CI](https://github.com/jainamjodhawat/pollchain/actions/workflows/ci.yml/badge.svg)](https://github.com/jainamjodhawat/pollchain/actions/workflows/ci.yml)
[![Production Validation](https://github.com/jainamjodhawat/pollchain/actions/workflows/deployment-validation.yml/badge.svg)](https://github.com/jainamjodhawat/pollchain/actions/workflows/deployment-validation.yml)

PollChain is a lightweight governance platform that lets any community create proposals, vote with POLL tokens, and automatically execute decisions on-chain — all for fractions of a cent on Stellar.

## Level 5 Reviewer Index

The [Level 5 evidence matrix](docs/LEVEL5_EVIDENCE.md) is the submission source of truth. It links completed product work and marks the real-user items that remain pending rather than inventing traction.

- [Professional pitch deck](docs/evidence/level5-pitch/PollChain_Level5_Pitch_Deck.pptx) · [deck preview](docs/evidence/level5-pitch/verified-montage.png)
- [50-wallet analysis workbook](docs/evidence/level5-workbook/PollChain_Level5_User_Analysis.xlsx) · [dashboard preview](docs/evidence/level5-workbook/dashboard.png)
- [Growth and retention strategy](docs/GROWTH_STRATEGY.md)
- [Updated walkthrough script](docs/DEMO_SCRIPT.md)
- [Narrated Level 5 product walkthrough](docs/evidence/level5-demo/PollChain_Level5_Walkthrough.mp4) · [`3abb232`](https://github.com/jainamjodhawat/pollchain/commit/3abb232)
- [Existing product demo](https://drive.google.com/file/d/15bN3Q3Ho2Wd_1nERBiSsWyTZvWUEAMKx/view?usp=sharing)

Level 5 product improvements were committed separately by the repository owner:

- [`87e95b7`](https://github.com/jainamjodhawat/pollchain/commit/87e95b7) — application-wide wallet session and more reliable connect/disconnect behavior
- [`4e055e1`](https://github.com/jainamjodhawat/pollchain/commit/4e055e1) — guided connect → fund → transact onboarding
- [`a0e2123`](https://github.com/jainamjodhawat/pollchain/commit/a0e2123) — reusable StellarExpert activity receipts

The 50-wallet campaign is not yet claimed as complete. After real testers interact, validate the public CSV with:

```bash
node scripts/validate-user-evidence.mjs \
  docs/evidence/user-wallet-interactions.csv \
  --minimum 50 \
  --interval-min 2 \
  --interval-max 3
```

Per owner instruction, this pass does not create or edit a Google Form. Personal tester details stay in the workbook's private intake sheet and are excluded from public evidence.

## Level 4 Reviewer Index

The [Level 4 evidence matrix](docs/LEVEL4_EVIDENCE.md) links the production
demo, testnet deployments, frontend integration, CI/CD, monitoring, onboarding,
feedback, screenshots, demo video and focused remediation commits.

- [`04f3fe6`](https://github.com/jainamjodhawat/pollchain/commit/04f3fe6) — explicit Soroban frontend integration and function cross-check
- [`9b53dbd`](https://github.com/jainamjodhawat/pollchain/commit/9b53dbd) — blocking contract/frontend CI and deployment validation
- [`f5b17a9`](https://github.com/jainamjodhawat/pollchain/commit/f5b17a9) — consent-gated monitoring, error recovery and performance work
- [`b038a61`](https://github.com/jainamjodhawat/pollchain/commit/b038a61) — Level 4 evidence, onboarding and feedback documentation
- [`f7540a7`](https://github.com/jainamjodhawat/pollchain/commit/f7540a7) — strict Soroban CI cleanup verified across every contract
- [`18e3320`](https://github.com/jainamjodhawat/pollchain/commit/18e3320) — deterministic frontend and Soroban dependency locks for reproducible CI
- [`a74dc91`](https://github.com/jainamjodhawat/pollchain/commit/a74dc91) — security audit compatibility fix using the committed Rust lockfile

- [Architecture and frontend-to-contract function map](docs/ARCHITECTURE.md)
- [Real-user onboarding and wallet-proof process](docs/USER_ONBOARDING.md)
- [Public user-feedback summary](docs/USER_FEEDBACK.md)
- [Consent-based wallet-interaction evidence CSV](docs/evidence/user-wallet-interactions.csv)

The repository includes a strict validator for the 10-user requirement:

```bash
node scripts/validate-user-evidence.mjs
```

It intentionally fails until ten independent, consented users have supplied
valid testnet wallet and transaction proof.

## 🌐 Live Demo

**[pollchain-orcin.vercel.app](https://pollchain-orcin.vercel.app)**

Production deployment verified on `/`, `/proposals`, and `/about`.

## 🎥 Demo Video

[▶ Watch Demo on Google Drive](https://drive.google.com/file/d/15bN3Q3Ho2Wd_1nERBiSsWyTZvWUEAMKx/view?usp=sharing)

---

> [!NOTE]
> ### 🌟 Journey to Mastery — Level 4 & 5 Newly Added Features
> 
> *   **🔗 Treasury-Execution Inter-Contract Integration**: Passing proposals automatically trigger execution, calling the Treasury on-chain to handle secure payouts to designated recipients.
> *   **🗳️ Quadratic Voting (QV)**: Implemented an on-chain Babylonian square root (`weight = isqrt(weight)`) algorithm to reduce voting centralization and whale dominance.
> *   **🎁 Voter Participation Rewards**: Added an automated reward distribution model that pays out POLL tokens from the Treasury to active governance participants.
> *   **📊 Interactive Cash Flow Analytics**: Built high-fidelity SVG Area and Bar Charts tracking cumulative balance trajectories and deposit/withdrawal distributions with hover card details.
> *   **🌳 Delegation Tree Network Visualizer**: Created a radial SVG node-link graph mapping delegator backing and active representative structures with directional power flow.

---

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
- ⚡ **Token-Weighted Voting** — Vote Yes / No / Abstain; weight = your POLL balance (or √balance under Quadratic Voting)
- 🔗 **Inter-Contract Execution** — Voting contract calls Execution contract on-chain when a proposal passes, which triggers token transfers from the Treasury
- 🪙 **Custom SEP-41 Token** — POLL governance token with mint, burn, transfer, allowance
- 🛡️ **Quorum Protection** — Proposals require minimum participation to be valid
- 💧 **Token Faucet** — Claim 1,000 POLL/day to participate in governance
- 🏦 **DAO Treasury** — Community-owned POLL reserve, deposit open to all
- 🤝 **Vote Delegation** — Delegate your voting power to a trusted community member, aggregating on-chain weight
- 📊 **Interactive Cash Flow Analytics** — Custom SVG Area and Bar Charts tracking cumulative balance trajectory and side-by-side deposits vs. withdrawals with hover tooltips
- 🌳 **Delegation Tree visualizer** — Interactive radial SVG node-link graph mapping delegator backing and active representative structures with power flow direction markers
- 🗳️ **Quadratic Voting (QV)** — On-chain integer square root calculation (`weight = isqrt(weight)`) to reduce whale dominance
- 🎁 **Voter Rewards System** — Automated participation incentives distributed directly from the Treasury to voters upon vote completion
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
voting           : 9 tests — create, double-vote, rewards, cancel, vote+finalize-fail, vote+finalize-pass, quorum, quadratic-voting, delegated-power
execution        : 5 tests — double-initialize, initialize, execute-logs, withdraw-specific, withdraw-treasury
faucet           : 5 tests — claim, double-claim, cooldown, set-amount, reserve
treasury         : 4 tests — deposit, withdraw-admin, unauthorized, tx-log
delegation       : 4 tests — delegate, undelegate, voting-power, self-delegate
```

**All 31 tests pass ✅**

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

## Latest User Feedback Pass

The following changes were requested through user feedback and implemented as separate commits by the repository owner (`jainamjodhawat`).

| # | User Feedback | Status | Fix Commit |
|---|---|---|---|
| 1 | "When I vote, I don’t see the percentage change instantly." | ✅ Fixed — keeps the optimistic result visible until the chain read confirms it. | [`54d45fe`](https://github.com/jainamjodhawat/pollchain/commit/54d45fe) |
| 2 | "I would like a new tab to view my proposals; it looks out of place in the nav." | ✅ Fixed — moved My Proposals into a dedicated personal-governance control. | [`7a636d3`](https://github.com/jainamjodhawat/pollchain/commit/7a636d3) |
| 3 | "The leaderboard layout could be better." | ✅ Fixed — redesigned it with a top-three view, responsive rankings, and wallet links. | [`7a636d3`](https://github.com/jainamjodhawat/pollchain/commit/7a636d3) |
| 4 | "The Connect Wallet flow doesn’t work sometimes." | ✅ Fixed — passive checks no longer request access, and duplicate wallet prompts are prevented. | [`bd6ac5f`](https://github.com/jainamjodhawat/pollchain/commit/bd6ac5f) |
| 5 | "Loading takes too much time." | ✅ Fixed — proposal reads share a cached request and refresh without replacing visible content. | [`bd6ac5f`](https://github.com/jainamjodhawat/pollchain/commit/bd6ac5f) |
| 6 | "The home page should contain more information on the platform." | ✅ Fixed — added a governance walkthrough and safeguard explainer. | [`ad1ddb2`](https://github.com/jainamjodhawat/pollchain/commit/ad1ddb2) |
| 7 | "Unable to vote No on the third proposal." | ✅ Fixed — preserves the failed-vote message, rolls back only failed optimistic state, and validates all vote choices consistently. | [`54d45fe`](https://github.com/jainamjodhawat/pollchain/commit/54d45fe) |

---

## License

MIT
