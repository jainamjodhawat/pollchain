# PollChain Level 5 Growth Strategy

## Objective

Validate whether a new Stellar user can connect a wallet, acquire POLL, complete one meaningful governance action and independently share public transaction proof.

The campaign target is 50 different human-controlled Stellar testnet wallets. Each accepted row must contain a real transaction visible on StellarExpert. Secret keys and seed phrases are never collected.

## Campaign design

Recruit ten cohorts of five testers from student groups, developer communities, online collectives and early-stage teams. Give every tester the same short task:

1. Open the live PollChain application.
2. Follow the Start flow to connect Freighter and fund the testnet wallet.
3. Claim POLL or complete a proposal, vote, delegation or treasury interaction.
4. Copy the activity receipt and confirm the StellarExpert page opens.
5. Provide a 1–5 rating and one concise feedback observation.

Transactions are scheduled globally 2–3 minutes apart. Fifty sequential interactions therefore require at least 98 minutes between the first and last transaction, so the campaign should reserve roughly 2–2.5 hours plus onboarding time. A shorter run must not be presented as interval-compliant.

## Metrics

| Metric | Definition | Target |
|---|---|---|
| Unique verified wallets | Distinct valid `G...` addresses with valid transaction proof | 50 |
| Evidence-ready rows | Consent + valid wallet + valid hash + matching explorer URL | 50 |
| Interval compliance | Consecutive UTC timestamps between 2 and 3 minutes | 100% |
| Activation | Tester reaches one confirmed on-chain action | At least 80% of invited testers |
| Rating | Average product rating from completed testers | Establish baseline; do not invent a target result |
| Top friction theme | Most frequent categorized feedback | Used to select the next fix |

## Retention and iteration loop

After the campaign, group feedback into wallet, funding, navigation, voting, proof, performance and other. Prioritize the next change using frequency, severity and whether the issue blocks activation.

The next phase will evolve PollChain in this order:

1. Fix the most frequent activation blocker and link the implementation commit.
2. Add proposal subscriptions or governance notifications if testers complete first actions but do not return.
3. Add community-level analytics only after transaction evidence is reliable enough to support meaningful comparisons.
4. Repeat a smaller cohort test and compare activation, errors and rating against the Level 5 baseline.

Completed improvement evidence is recorded in [the Level 5 evidence matrix](LEVEL5_EVIDENCE.md). Future feedback-driven commits must be added there and to the README before submission.

