import { readFile } from "node:fs/promises";
import path from "node:path";

const evidencePath = path.resolve(
  process.argv[2] ?? "docs/evidence/user-wallet-interactions.csv"
);
const csv = await readFile(evidencePath, "utf8");
const lines = csv
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);
const expectedHeader =
  "wallet_address,transaction_hash,interaction,stellar_expert_url,feedback_response_id,consent_to_publish,verified_at_utc";

if (lines[0] !== expectedHeader) {
  console.error(`Unexpected CSV header in ${evidencePath}.`);
  process.exit(1);
}

const rows = lines.slice(1).map((line, index) => {
  const values = line.split(",").map((value) => value.trim());
  if (values.length !== 7) {
    throw new Error(`Row ${index + 2} must contain exactly 7 columns.`);
  }
  return {
    line: index + 2,
    wallet: values[0],
    transactionHash: values[1],
    interaction: values[2],
    explorerUrl: values[3],
    feedbackId: values[4],
    consent: values[5],
    verifiedAt: values[6],
  };
});

const failures = [];
const wallets = new Set();
const transactionHashes = new Set();
const feedbackIds = new Set();
const walletPattern = /^G[A-Z2-7]{55}$/;
const transactionPattern = /^[a-fA-F0-9]{64}$/;
const allowedInteractions = new Set([
  "claim",
  "create_proposal",
  "vote_yes",
  "vote_no",
  "vote_abstain",
  "delegate",
  "undelegate",
  "treasury_deposit",
]);

for (const row of rows) {
  if (!walletPattern.test(row.wallet)) {
    failures.push(`Row ${row.line}: invalid Stellar public wallet address.`);
  }
  if (!transactionPattern.test(row.transactionHash)) {
    failures.push(`Row ${row.line}: invalid transaction hash.`);
  }
  if (!allowedInteractions.has(row.interaction)) {
    failures.push(`Row ${row.line}: unsupported interaction type.`);
  }
  if (
    row.explorerUrl !==
    `https://stellar.expert/explorer/testnet/tx/${row.transactionHash}`
  ) {
    failures.push(`Row ${row.line}: StellarExpert URL does not match the hash.`);
  }
  if (!row.feedbackId) {
    failures.push(`Row ${row.line}: feedback response ID is required.`);
  }
  if (row.consent !== "true") {
    failures.push(`Row ${row.line}: publication consent must be true.`);
  }
  if (
    !row.verifiedAt ||
    Number.isNaN(Date.parse(row.verifiedAt)) ||
    !row.verifiedAt.endsWith("Z")
  ) {
    failures.push(`Row ${row.line}: verified_at_utc must be an ISO UTC value.`);
  }
  if (wallets.has(row.wallet)) {
    failures.push(`Row ${row.line}: duplicate wallet address.`);
  }
  if (transactionHashes.has(row.transactionHash)) {
    failures.push(`Row ${row.line}: duplicate transaction hash.`);
  }
  if (feedbackIds.has(row.feedbackId)) {
    failures.push(`Row ${row.line}: duplicate feedback response ID.`);
  }

  wallets.add(row.wallet);
  transactionHashes.add(row.transactionHash);
  feedbackIds.add(row.feedbackId);
}

if (wallets.size < 10) {
  failures.push(
    `At least 10 unique real-user wallets are required; found ${wallets.size}.`
  );
}

if (failures.length > 0) {
  console.error("User evidence validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Validated ${wallets.size} unique consented user wallets and ${transactionHashes.size} confirmed transaction records.`
);
