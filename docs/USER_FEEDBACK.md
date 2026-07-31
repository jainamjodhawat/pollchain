# User feedback summary

PollChain collects structured feedback through the
[feedback form](https://forms.gle/8aS53MmL2ocw1V7bA). The private response
sheet remains under the project owner's access control; this public summary
contains no respondent personal data.

| Feedback theme | Product response | Commit |
|---|---|---|
| Vote percentages should update immediately | Added optimistic vote totals that remain visible until the chain read confirms them | [`54d45fe`](https://github.com/jainamjodhawat/pollchain/commit/54d45fe) |
| Users need a dedicated view of their proposals | Added My Proposals and moved it into the personal-governance area | [`7a636d3`](https://github.com/jainamjodhawat/pollchain/commit/7a636d3) |
| Leaderboard was difficult to scan | Added podium cards, responsive rows and explorer links | [`7a636d3`](https://github.com/jainamjodhawat/pollchain/commit/7a636d3) |
| Wallet connection was unreliable | Removed passive permission prompts and prevented duplicate connection attempts | [`bd6ac5f`](https://github.com/jainamjodhawat/pollchain/commit/bd6ac5f) |
| Proposal loading took too long | Added shared in-flight requests, caching and non-blocking refreshes | [`bd6ac5f`](https://github.com/jainamjodhawat/pollchain/commit/bd6ac5f) |
| The home page did not explain the platform | Added governance steps, safeguards and platform context | [`ad1ddb2`](https://github.com/jainamjodhawat/pollchain/commit/ad1ddb2) |
| A No vote failed without useful feedback | Corrected enum encoding, kept errors visible and rolled back failed optimistic state | [`54d45fe`](https://github.com/jainamjodhawat/pollchain/commit/54d45fe) |

## Feedback loop

1. Capture feedback without publishing personal data.
2. Reproduce and scope the issue.
3. Implement one focused change.
4. Run contract/frontend validation.
5. Link the fix commit in this summary and the main README.
