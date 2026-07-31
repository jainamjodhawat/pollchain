# Real-user onboarding and proof collection

Use this guide with each Level 4 tester. A tester must control their own
Freighter wallet and approve their own transaction. Generated wallets operated
by the project team do not count as real-user proof.

## Tester flow

1. Open the [PollChain live application](https://pollchain-orcin.vercel.app).
2. Install or unlock Freighter and select Stellar Testnet.
3. Connect the wallet and confirm the displayed public address.
4. Open **Faucet** and claim test POLL.
5. Complete one meaningful action:
   - create a proposal;
   - vote Yes, No, or Abstain;
   - delegate voting power; or
   - deposit test POLL into the treasury.
6. Open the transaction in StellarExpert and copy its transaction hash.
7. Complete the
   [feedback form](https://forms.gle/8aS53MmL2ocw1V7bA).
8. Explicitly consent to publishing the public wallet address and transaction
   hash as Level 4 proof.

Never collect secret keys, recovery phrases, wallet passwords, or signed
blank transactions.

## Evidence entry

Add one CSV row to
`docs/evidence/user-wallet-interactions.csv` with:

- a unique public `G...` wallet address;
- a confirmed 64-character transaction hash;
- the completed interaction type;
- the matching StellarExpert testnet URL;
- an internal/pseudonymous feedback response ID;
- `true` only after publication consent; and
- an ISO-8601 UTC verification timestamp.

After ten real users are recorded, run:

```bash
node scripts/validate-user-evidence.mjs
```

The command rejects duplicate wallets, malformed transaction hashes, missing
consent, missing feedback IDs, and fewer than ten entries.
