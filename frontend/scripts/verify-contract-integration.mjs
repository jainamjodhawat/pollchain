import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const frontendRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const repositoryRoot = path.resolve(frontendRoot, "..");

const integrations = [
  {
    contract: "voting",
    methods: [
      ["proposal_count", "fetchProposalCount"],
      ["get_proposal", "fetchProposal"],
      ["get_proposals", "fetchProposals"],
      ["get_vote", "fetchVote"],
      ["get_config", "fetchVotingConfig"],
      ["create_proposal", "createProposal"],
      ["vote", "castVote"],
      ["finalize", "finalizeProposal"],
    ],
  },
  {
    contract: "governance_token",
    methods: [
      ["balance", "fetchTokenBalance"],
      ["total_supply", "fetchTotalSupply"],
    ],
  },
  {
    contract: "faucet",
    methods: [
      ["get_config", "fetchFaucetConfig"],
      ["get_last_claim", "fetchLastClaim"],
      ["get_reserve", "fetchFaucetReserve"],
      ["claim", "claimFaucet"],
    ],
  },
  {
    contract: "treasury",
    methods: [
      ["get_balance", "fetchTreasuryBalance"],
      ["get_transactions", "fetchTreasuryTxs"],
      ["deposit", "depositTreasury"],
    ],
  },
  {
    contract: "delegation",
    methods: [
      ["get_delegate", "fetchDelegate"],
      ["get_delegators", "fetchDelegators"],
      ["get_voting_power", "fetchVotingPower"],
      ["delegate", "delegateTo"],
      ["undelegate", "undelegateVotes"],
    ],
  },
];

const frontendSource = await readFile(
  path.join(frontendRoot, "src/utils/contracts.ts"),
  "utf8"
);
const envExample = await readFile(
  path.join(frontendRoot, ".env.example"),
  "utf8"
);
const failures = [];
let verifiedMethods = 0;

for (const integration of integrations) {
  const rustSource = await readFile(
    path.join(
      repositoryRoot,
      "contracts",
      integration.contract,
      "src/lib.rs"
    ),
    "utf8"
  );

  for (const [contractMethod, frontendFunction] of integration.methods) {
    const rustMethod = new RegExp(
      `(?:pub\\s+)?fn\\s+${contractMethod}\\s*\\(`
    );
    const typescriptWrapper = new RegExp(
      `export\\s+async\\s+function\\s+${frontendFunction}\\s*\\(`
    );
    const methodInvocation = new RegExp(
      `["']${contractMethod}["']`
    );

    if (!rustMethod.test(rustSource)) {
      failures.push(
        `${integration.contract}.${contractMethod}: Rust method missing`
      );
    }
    if (!typescriptWrapper.test(frontendSource)) {
      failures.push(
        `${integration.contract}.${contractMethod}: frontend wrapper ${frontendFunction} missing`
      );
    }
    if (!methodInvocation.test(frontendSource)) {
      failures.push(
        `${integration.contract}.${contractMethod}: contract call string missing`
      );
    }
    verifiedMethods += 1;
  }
}

const configuredContractIds = [
  ...envExample.matchAll(
    /^VITE_[A-Z_]+_CONTRACT_ID=(C[A-Z2-7]{55})$/gm
  ),
];
if (configuredContractIds.length !== 6) {
  failures.push(
    `Expected 6 valid Stellar contract IDs in frontend/.env.example; found ${configuredContractIds.length}`
  );
}

if (failures.length > 0) {
  console.error("Soroban integration cross-check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Verified ${verifiedMethods} frontend wrappers against 5 Rust contracts and ${configuredContractIds.length} deployed contract IDs.`
);
