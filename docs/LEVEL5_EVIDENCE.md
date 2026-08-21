# PollChain Level 5 Evidence Matrix

This page is the reviewer index for PollChain's user-growth and product-iteration phase. It distinguishes completed product work from evidence that can only be collected from real testers.

## Current status

| Requirement | Status | Evidence |
|---|---|---|
| Public GitHub repository | Ready | [jainamjodhawat/pollchain](https://github.com/jainamjodhawat/pollchain) |
| Minimum 20 meaningful commits | Ready | The repository exceeded 50 owner-authored commits before this Level 5 documentation pass. |
| Live deployed application | Ready | [pollchain-orcin.vercel.app](https://pollchain-orcin.vercel.app) |
| Professional pitch deck | Ready | [PollChain Level 5 pitch deck](evidence/level5-pitch/PollChain_Level5_Pitch_Deck.pptx) and [visual preview](evidence/level5-pitch/verified-montage.png) |
| Tester analysis workbook | Ready for data | [PollChain Level 5 user analysis workbook](evidence/level5-workbook/PollChain_Level5_User_Analysis.xlsx) |
| Product improvements | Ready | Shared wallet session, guided onboarding and reusable transaction receipts are linked below. |
| Updated documentation | Ready | This matrix, [growth strategy](GROWTH_STRATEGY.md), [demo script](DEMO_SCRIPT.md) and main README. |
| Existing product demo | Available | [Current walkthrough](https://drive.google.com/file/d/15bN3Q3Ho2Wd_1nERBiSsWyTZvWUEAMKx/view?usp=sharing) |
| Updated Level 5 walkthrough | Ready | [Narrated six-minute product walkthrough](evidence/level5-demo/PollChain_Level5_Walkthrough.mp4), generated from verified production captures in [`3abb232`](https://github.com/jainamjodhawat/pollchain/commit/3abb232). |
| 50 different real wallet interactions | Pending real testers | No wallets or transactions are fabricated. The workbook and validator are ready for the tester session. |
| 2–3 minute transaction interval | Pending real testers | The workbook calculates each interval and the strict validation command rejects evidence outside the range. |
| Transaction/analytics screenshots | Pending campaign | The updated UI is captured in the walkthrough. Final transaction screenshots still require the completed 50-wallet campaign. |

## Level 5 product iteration commits

| Change | Why it matters | Commit |
|---|---|---|
| Shared wallet session | Removes inconsistent connected/disconnected state between pages and reduces repeated wallet prompts. | [`87e95b7`](https://github.com/jainamjodhawat/pollchain/commit/87e95b7) |
| Guided first-transaction onboarding | Gives new users a visible connect → fund → act path with progress. | [`4e055e1`](https://github.com/jainamjodhawat/pollchain/commit/4e055e1) |
| Reusable activity receipts | Makes wallet, transaction hash and StellarExpert proof easy to copy after an on-chain action. | [`a0e2123`](https://github.com/jainamjodhawat/pollchain/commit/a0e2123) |

## Strict evidence validation

The public CSV remains the source accepted by the repository validator. Populate it only with consented, real transaction evidence, then run:

```bash
node scripts/validate-user-evidence.mjs \
  docs/evidence/user-wallet-interactions.csv \
  --minimum 50 \
  --interval-min 2 \
  --interval-max 3
```

The command checks unique wallet addresses, unique transaction hashes, exact StellarExpert URLs, consent, UTC timestamps and the global 2–3 minute interval.

## Google Forms scope

No Google Form was created or edited in this Level 5 pass, as requested by the repository owner. The workbook provides the offline intake and analysis workflow without publishing personal information.
