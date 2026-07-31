# Level 4 submission evidence

This file is the reviewer index for PollChain. It separates verified repository
evidence from evidence that still requires an external human action.

## Verified repository evidence

| Requirement | Status | Evidence |
|---|---|---|
| Public GitHub repository | Ready | [jainamjodhawat/pollchain](https://github.com/jainamjodhawat/pollchain) |
| Production MVP | Ready | [Live application](https://dist-six-psi-56.vercel.app) and feature list in the main README |
| Stable frontend/contract architecture | Ready | [Architecture and 22-function map](./ARCHITECTURE.md) |
| Frontend Soroban integration | Ready | `frontend/src/integrations/sorobanClient.ts` and `frontend/src/utils/contracts.ts` |
| Mobile responsive UI | Ready | Desktop/mobile screenshots in the main README |
| Loading and error handling | Ready | Route Suspense fallback, request states and global error boundary |
| Smart contracts on Stellar Testnet | Ready | Six addresses and StellarExpert links in the main README |
| Minimum 15 meaningful commits | Ready | More than 40 commits, including the focused Level 4 remediation commits below |
| Contract CI | Ready | `.github/workflows/ci.yml`: test, strict Clippy, release WASM build and artifact |
| Frontend CI | Ready | `.github/workflows/ci.yml`: install, integration map, lint, type-check, build and audit |
| CD validation | Ready in repository | `.github/workflows/deployment-validation.yml` and `scripts/smoke-production.mjs` |
| Monitoring/analytics integration | Ready in repository | Consent-gated Vercel Analytics and Speed Insights; disabled until deployment flag and visitor consent |
| User onboarding | Ready | [Real-user onboarding guide](./USER_ONBOARDING.md) |
| Basic feedback collection | Ready | [Feedback summary](./USER_FEEDBACK.md) and linked form |
| Complete documentation | Ready | Main README, architecture, onboarding, feedback and this evidence index |
| Demo video | Ready | [Google Drive demo](https://drive.google.com/file/d/15bN3Q3Ho2Wd_1nERBiSsWyTZvWUEAMKx/view?usp=sharing) |

## Level 4 remediation commits

| Commit | Evidence added |
|---|---|
| [`04f3fe6`](https://github.com/jainamjodhawat/pollchain/commit/04f3fe6) | Explicit Soroban transport and automated Rust↔TypeScript function cross-check |
| [`9b53dbd`](https://github.com/jainamjodhawat/pollchain/commit/9b53dbd) | Blocking contract/frontend CI, dependency upgrades and deployment smoke workflow |
| [`f5b17a9`](https://github.com/jainamjodhawat/pollchain/commit/f5b17a9) | Consent-gated analytics, Speed Insights, global error recovery and route code splitting |
| [`b038a61`](https://github.com/jainamjodhawat/pollchain/commit/b038a61) | Level 4 reviewer index, architecture map, onboarding guide, feedback summary and real-user evidence validator |
| [`f7540a7`](https://github.com/jainamjodhawat/pollchain/commit/f7540a7) | Strict Clippy cleanup verified against all contract targets, 31 tests and six release WASM builds |
| [`18e3320`](https://github.com/jainamjodhawat/pollchain/commit/18e3320) | Committed Rust and npm dependency graphs with locked CI commands for reproducible Linux builds |

## External evidence still required before submission

These cannot be truthfully created from source code alone:

| Requirement | Current status | Completion action |
|---|---|---|
| 10+ real-user wallet interactions | Not yet proven in this repository | Onboard ten independent testers, collect consented public wallet/transaction evidence, then run `node scripts/validate-user-evidence.mjs` |
| Monitoring/analytics screenshot | Requires owner dashboard access and traffic | Enable `VITE_ENABLE_ANALYTICS=true`, obtain visitor consent, then capture the Vercel Analytics or Speed Insights dashboard |
| Current deployed deep-link validation | Requires redeployment of the new Vercel rewrite configuration | Deploy the latest main branch, then run `node scripts/smoke-production.mjs https://<production-url>` |

Do not mark these rows complete or submit generated-wallet activity as
real-user evidence.
