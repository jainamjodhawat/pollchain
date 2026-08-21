import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import { promisify } from "node:util";

const run = promisify(execFile);
const captureDir = process.env.POLLCHAIN_DEMO_CAPTURE_DIR ?? "/private/tmp/pollchain-level5-demo";
const workDir = "/private/tmp/pollchain-level5-video";
const outputDir = "docs/evidence/level5-demo";
const narration = [
  "Welcome to PollChain, a governance platform built on Stellar and Soroban. This Level 5 walkthrough starts with the new first-transaction guide. Instead of dropping a first-time user into a dashboard, PollChain presents a three-step trail: connect a Freighter wallet on Stellar testnet, claim POLL voting power, and complete one meaningful governance action. The page also explains what public proof to keep and what must remain private. A wallet address and transaction hash can be shared, but a secret key, password, or recovery phrase must never be collected.",
  "The home page positions the platform around a simple outcome: propose, vote, and execute community decisions on-chain. It now includes more information about the product, the governance journey, contract safeguards, and the Stellar testnet environment. From here a visitor can browse active proposals, begin a proposal, open the faucet, or learn how the architecture works. The navigation separates community areas from the personal My Proposals control, making the main product routes easier to scan on desktop and mobile.",
  "The proposal directory is the main participation surface. Proposal data is loaded through the Soroban integration layer, with visible loading and error recovery rather than a blank page. Each proposal card communicates its status, voting progress, timing, and route into the detailed voting experience. PollChain supports Yes, No, and Abstain choices. After a vote, the interface keeps the optimistic percentage visible while the confirmed chain read catches up, fixing the earlier feedback that vote percentages appeared stale.",
  "My Proposals gives a connected member one focused place to review the proposals created by their wallet. This was added directly from user feedback because personal proposals were previously difficult to find and the old navigation treatment felt out of place. The route is wallet-aware and does not invent data for disconnected visitors. Once a user connects, it filters on-chain proposal records to the active public address and preserves the same loading, empty, and error states used across the application.",
  "The redesigned leaderboard makes governance participation easier to compare. It gives the top three contributors stronger visual hierarchy, keeps the remaining ranking readable, and links wallet identities to public Stellar activity where appropriate. The responsive layout avoids forcing a desktop table onto smaller screens. This screen is designed to make participation visible without pretending that a ranking is the same as governance authority. Contract rules still determine voting power, quorum, execution, delegation, and rewards.",
  "The dashboard summarizes a connected wallet's governance activity, including voting power, proposals, votes, and related actions. Wallet state now comes from one application-wide provider instead of separate page-level sessions. That change addresses intermittent connection behavior and prevents different routes from disagreeing about whether the wallet is connected. An explicit disconnect is remembered for the browser session, while a connected user can move through the product without being prompted repeatedly.",
  "PollChain uses a React and TypeScript frontend, Freighter for wallet approval, Stellar RPC for simulation and submission, and six Soroban contracts. The voting contract manages proposals and votes. The governance token provides POLL balances and voting weight. The execution contract handles approved actions. The treasury manages community assets. The faucet supports testnet onboarding, and delegation lets members assign voting power. Continuous integration cross-checks frontend method names against the Rust contracts, runs thirty-one contract tests, builds release WASM files, and audits dependencies.",
  "The create flow turns a governance idea into a Soroban transaction. The form guides the proposer through the title, description, voting period, and any execution details required by the selected action. Validation runs before the wallet signs, and loading states explain whether the app is preparing, awaiting approval, submitting, or confirming. After a successful transaction, the reusable activity receipt exposes the public wallet, transaction hash, and StellarExpert link so a tester can copy proof without searching through technical logs.",
  "The faucet is the activation bridge for new users. On Stellar testnet, a connected wallet can claim POLL tokens and gain the voting power needed to participate. The contract enforces its claim amount, reserve behavior, and cooldown rules on-chain. The interface reports contract failures clearly and, after confirmation, produces the same shareable transaction receipt used elsewhere. This consistency matters for the Level 5 campaign because every tester can provide evidence in the same format regardless of the action they complete.",
  "Delegation lets a member assign voting power to a trusted representative without transferring wallet ownership or sharing credentials. The interface supports delegating and undelegating, then shows the resulting relationship and effective power. The Soroban tests cover delegation, undelegation, self-delegation protection, and voting-power calculation. For communities that cannot expect every member to follow every proposal, delegation offers a practical path to participation while keeping the final relationship publicly auditable.",
  "The treasury provides transparent deposits, authorized withdrawals, transaction history, and analytics around community funds. Passing proposals can connect voting, execution, and treasury behavior through inter-contract calls. PollChain is live, public, documented, and ready for the Level 5 evidence campaign. The campaign tracker currently reports zero of fifty real wallets because no human users are being fabricated. Completion requires fifty different human-controlled testnet wallets, real StellarExpert-visible transactions spaced two to three minutes apart, consented public evidence, and final screenshots of the completed dashboard. That honest boundary keeps the submission verifiable.",
];

await fs.mkdir(workDir, { recursive: true });
await fs.mkdir(outputDir, { recursive: true });

const segmentPaths = [];
for (let index = 0; index < narration.length; index += 1) {
  const number = String(index + 1).padStart(2, "0");
  const imageNames = ["01-onboarding", "02-home", "03-proposals", "04-my-proposals", "05-leaderboard", "06-dashboard", "07-about", "08-create", "09-faucet", "10-delegate", "11-treasury"];
  const audioPath = `${workDir}/${number}.aiff`;
  const videoPath = `${workDir}/${number}.mp4`;
  await run("/usr/bin/say", ["-v", "Samantha", "-r", "178", "-o", audioPath, narration[index]]);
  await run("/opt/homebrew/bin/ffmpeg", [
    "-y", "-loop", "1", "-i", `${captureDir}/${imageNames[index]}.png`, "-i", audioPath,
    "-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=0xF7F4E8,format=yuv420p",
    "-c:v", "libx264", "-preset", "medium", "-crf", "22", "-tune", "stillimage",
    "-c:a", "aac", "-b:a", "128k", "-shortest", "-movflags", "+faststart", videoPath,
  ]);
  segmentPaths.push(videoPath);
}

const concatFile = `${workDir}/segments.txt`;
await fs.writeFile(concatFile, segmentPaths.map((item) => `file '${item}'`).join("\n"));
await run("/opt/homebrew/bin/ffmpeg", [
  "-y", "-f", "concat", "-safe", "0", "-i", concatFile,
  "-c", "copy", "-movflags", "+faststart", `${outputDir}/PollChain_Level5_Walkthrough.mp4`,
]);
await fs.copyFile(`${captureDir}/01-onboarding.png`, `${outputDir}/PollChain_Level5_Walkthrough_Poster.png`);

