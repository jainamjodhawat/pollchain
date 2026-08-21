import fs from "node:fs/promises";
const { Presentation, PresentationFile } = await import(
  process.env.POLLCHAIN_ARTIFACT_TOOL_MODULE ?? "@oai/artifact-tool"
);

const OUT = "docs/evidence/level5-pitch";
const W = 1280;
const H = 720;
const C = {
  ink: "#11140B",
  olive: "#5A6A2E",
  oliveDark: "#344018",
  lime: "#D7ED74",
  cream: "#F7F4E8",
  panel: "#E9ECD9",
  line: "#B9BEA4",
  white: "#FFFFFF",
  muted: "#626755",
};

const deck = Presentation.create({ slideSize: { width: W, height: H } });

function box(slide, left, top, width, height, fill = C.panel, line = "none", radius = false) {
  return slide.shapes.add({
    geometry: radius ? "roundRect" : "rect",
    position: { left, top, width, height },
    fill,
    line: { style: "solid", fill: line, width: line === "none" ? 0 : 1 },
    ...(radius ? { borderRadius: "rounded-xl" } : {}),
  });
}

function text(slide, value, left, top, width, height, options = {}) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    position: { left, top, width, height },
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  shape.text = value;
  shape.text.style = {
    fontSize: options.size ?? 22,
    typeface: "Helvetica Neue",
    color: options.color ?? C.ink,
    bold: options.bold ?? false,
    alignment: options.align ?? "left",
    verticalAlignment: options.valign ?? "top",
  };
  return shape;
}

function title(slide, value, number) {
  text(slide, value, 52, 38, 1120, 76, { size: 42, bold: true });
  text(slide, String(number).padStart(2, "0"), 1180, 656, 44, 20, { size: 13, color: C.muted, align: "right" });
}

function notes(slide, body, sources = []) {
  const sourceBlock = sources.length ? `\n\n[Sources]\n${sources.map((source) => `- ${source}`).join("\n")}\n[/Sources]` : "";
  slide.speakerNotes.textFrame.setText(`${body}${sourceBlock}`);
}

// 1 — cover. Sparse, Codex Grid-inspired stacked type.
{
  const s = deck.slides.add();
  s.background.fill = C.cream;
  box(s, 0, 0, 24, H, C.lime);
  text(s, "STELLAR LEVEL 5 • PRODUCT GROWTH", 56, 46, 600, 34, { size: 18, bold: true, color: C.olive });
  text(s, "PollChain", 56, 186, 820, 110, { size: 78, bold: true });
  text(s, "Governance that turns a wallet into a visible, verifiable vote.", 56, 312, 760, 134, { size: 38 });
  box(s, 912, 122, 250, 250, C.oliveDark, "none", true);
  text(s, "P", 912, 152, 250, 160, { size: 120, bold: true, color: C.lime, align: "center", valign: "middle" });
  text(s, "LIVE MVP  •  TESTNET", 56, 620, 500, 28, { size: 18, bold: true, color: C.olive });
  notes(s, "Open with the idea that participation should produce public proof without forcing communities into expensive or opaque governance tooling.", [
    "https://pollchain-orcin.vercel.app",
    "https://github.com/jainamjodhawat/pollchain",
  ]);
}

// 2 — problem.
{
  const s = deck.slides.add(); s.background.fill = C.white; title(s, "Small communities still govern through scattered, unverifiable tools", 2);
  const xs = [52, 444, 836];
  const items = [
    ["01", "Participation is fragmented", "Wallet identity, discussion and voting live in different places, so the decision trail is hard to audit."],
    ["02", "Trust depends on screenshots", "Members cannot independently verify who interacted, what was recorded or when the action happened."],
    ["03", "On-chain UX is intimidating", "Network setup, funding and transaction proof create friction before a first meaningful action."],
  ];
  items.forEach((item, i) => {
    box(s, xs[i], 174, 340, 404, i === 1 ? C.oliveDark : C.panel, "none", true);
    text(s, item[0], xs[i] + 24, 198, 70, 42, { size: 24, bold: true, color: i === 1 ? C.lime : C.olive });
    text(s, item[1], xs[i] + 24, 266, 292, 94, { size: 30, bold: true, color: i === 1 ? C.white : C.ink });
    text(s, item[2], xs[i] + 24, 382, 292, 148, { size: 20, color: i === 1 ? C.white : C.muted });
  });
  notes(s, "Frame the problem around auditability and activation, not around replacing community discussion.");
}

// 3 — solution flow.
{
  const s = deck.slides.add(); s.background.fill = C.cream; title(s, "PollChain compresses governance into one verifiable flow", 3);
  const steps = [
    ["CONNECT", "Freighter wallet"], ["PROPOSE", "Create on Soroban"], ["VOTE", "Yes or no"], ["PROVE", "Copy transaction receipt"],
  ];
  const xs = [52, 354, 656, 958];
  box(s, 78, 335, 1070, 4, C.olive);
  steps.forEach((step, i) => {
    box(s, xs[i], 220, 236, 252, i === 3 ? C.oliveDark : C.white, C.line, true);
    box(s, xs[i] + 92, 316, 52, 52, C.lime, C.oliveDark, true);
    text(s, String(i + 1), xs[i] + 92, 323, 52, 32, { size: 22, bold: true, align: "center" });
    text(s, step[0], xs[i] + 20, 246, 196, 34, { size: 18, bold: true, color: i === 3 ? C.lime : C.olive, align: "center" });
    text(s, step[1], xs[i] + 22, 390, 192, 52, { size: 21, bold: true, color: i === 3 ? C.white : C.ink, align: "center" });
  });
  text(s, "Each successful action returns a wallet, transaction hash and StellarExpert link.", 194, 538, 892, 54, { size: 28, bold: true, align: "center" });
  notes(s, "Walk judges through the user journey. The new receipt component is reused across faucet, proposal, vote, delegation and treasury interactions.", [
    "https://github.com/jainamjodhawat/pollchain/commit/a0e2123",
  ]);
}

// 4 — architecture.
{
  const s = deck.slides.add(); s.background.fill = C.white; title(s, "Six contracts separate governance responsibilities without fragmenting the experience", 4);
  box(s, 52, 156, 250, 430, C.oliveDark, "none", true);
  text(s, "React MVP", 78, 188, 198, 42, { size: 30, bold: true, color: C.white });
  text(s, "Wallet session\nTransaction builder\nLoading + errors\nActivity receipt", 78, 254, 198, 210, { size: 22, color: C.white });
  text(s, "Freighter + Stellar RPC", 78, 510, 198, 44, { size: 18, bold: true, color: C.lime });
  box(s, 328, 338, 102, 4, C.olive);
  const contracts = ["Voting", "Governance token", "Execution", "Treasury", "Faucet", "Delegation"];
  contracts.forEach((name, i) => {
    const col = i % 3; const row = Math.floor(i / 3); const x = 458 + col * 258; const y = 164 + row * 220;
    box(s, x, y, 218, 172, i === 0 ? C.lime : C.panel, C.line, true);
    text(s, `0${i + 1}`, x + 20, y + 18, 50, 28, { size: 16, bold: true, color: C.olive });
    text(s, name, x + 20, y + 72, 178, 60, { size: 25, bold: true });
  });
  notes(s, "Explain the stable split: the frontend calls Soroban through one integration layer while contracts keep voting, token, execution, treasury, faucet and delegation responsibilities separate.", [
    "https://github.com/jainamjodhawat/pollchain/blob/main/docs/ARCHITECTURE.md",
    "https://developers.stellar.org/docs/build/smart-contracts/overview",
  ]);
}

// 5 — onboarding.
{
  const s = deck.slides.add(); s.background.fill = C.cream; title(s, "The first transaction now feels like a guided trail, not a setup checklist", 5);
  const ys = [178, 328, 478];
  const labels = [
    ["1", "Connect", "One shared wallet session across every page"],
    ["2", "Fund", "Open Friendbot and claim POLL from the faucet"],
    ["3", "Act", "Vote, then copy public proof in one click"],
  ];
  box(s, 116, 204, 6, 330, C.olive);
  labels.forEach((item, i) => {
    box(s, 86, ys[i], 66, 66, i === 2 ? C.lime : C.oliveDark, "none", true);
    text(s, item[0], 86, ys[i] + 12, 66, 38, { size: 26, bold: true, color: i === 2 ? C.ink : C.white, align: "center" });
    text(s, item[1], 190, ys[i] - 2, 220, 38, { size: 28, bold: true });
    text(s, item[2], 190, ys[i] + 46, 470, 52, { size: 20, color: C.muted });
  });
  box(s, 770, 178, 390, 370, C.oliveDark, "none", true);
  text(s, "PUBLIC PROOF", 804, 210, 320, 30, { size: 17, bold: true, color: C.lime });
  text(s, "Vote submitted", 804, 272, 320, 42, { size: 30, bold: true, color: C.white });
  text(s, "Wallet\nGB6K…4S2A\n\nTransaction\n8c31…a10f\n\n↗ StellarExpert", 804, 338, 320, 174, { size: 20, color: C.white });
  notes(s, "Show how onboarding and receipts reinforce each other. The proof panel is illustrative; do not present the shortened example as a real transaction.", [
    "https://github.com/jainamjodhawat/pollchain/commit/4e055e1",
    "https://github.com/jainamjodhawat/pollchain/commit/87e95b7",
  ]);
}

// 6 — iteration.
{
  const s = deck.slides.add(); s.background.fill = C.white; title(s, "User feedback changed both the product surface and the reliability underneath it", 6);
  const rows = [
    ["Vote percentages felt stale", "Optimistic refresh after vote"],
    ["My proposals were hard to find", "Dedicated My Proposals route"],
    ["Wallet state was inconsistent", "One application-wide wallet provider"],
    ["Proof was hard to share", "Reusable transaction receipts"],
  ];
  text(s, "FEEDBACK", 64, 142, 300, 28, { size: 17, bold: true, color: C.olive });
  text(s, "PRODUCT RESPONSE", 664, 142, 400, 28, { size: 17, bold: true, color: C.olive });
  rows.forEach((row, i) => {
    const y = 190 + i * 104;
    box(s, 52, y, 500, 78, C.panel, "none", true);
    text(s, row[0], 76, y + 18, 452, 42, { size: 22, bold: true });
    box(s, 580, y + 37, 56, 4, C.lime);
    box(s, 664, y, 564, 78, i === 3 ? C.oliveDark : C.cream, C.line, true);
    text(s, row[1], 688, y + 18, 516, 42, { size: 22, bold: true, color: i === 3 ? C.white : C.ink });
  });
  notes(s, "Tie each response to repository evidence. The README contains the earlier feedback-to-commit table; Level 5 adds wallet stability, onboarding and activity proof as separate owner commits.", [
    "https://github.com/jainamjodhawat/pollchain/blob/main/docs/USER_FEEDBACK.md",
    "https://github.com/jainamjodhawat/pollchain/commit/87e95b7",
    "https://github.com/jainamjodhawat/pollchain/commit/a0e2123",
  ]);
}

// 7 — verified readiness.
{
  const s = deck.slides.add(); s.background.fill = C.cream; title(s, "The product foundation is ready for a measured 50-wallet campaign", 7);
  text(s, "Verified before campaign launch", 52, 128, 680, 36, { size: 22, color: C.muted });
  const stats = [["6", "Soroban contracts"], ["31", "contract tests"], ["54", "meaningful commits"]];
  stats.forEach((stat, i) => {
    const x = 52 + i * 392;
    box(s, x, 226, 352, 286, i === 0 ? C.lime : C.white, C.line, true);
    text(s, stat[0], x + 28, 266, 296, 112, { size: 82, bold: true });
    text(s, stat[1], x + 28, 406, 296, 56, { size: 24, bold: true });
  });
  box(s, 52, 562, 1148, 54, C.oliveDark, "none", true);
  text(s, "50 unique real wallets • 2–3 minute interval • transaction proof — PENDING TESTER COHORT", 74, 575, 1104, 28, { size: 19, bold: true, color: C.white, align: "center" });
  notes(s, "Be explicit: the technology and evidence workflow are ready, but the Level 5 50-wallet target is not claimed until real testers complete real transactions. Commit count is measured at deck generation time.", [
    "https://github.com/jainamjodhawat/pollchain",
    "https://github.com/jainamjodhawat/pollchain/blob/main/README.md#contract-tests",
  ]);
}

// 8 — growth plan.
{
  const s = deck.slides.add(); s.background.fill = C.white; title(s, "Growth starts with one observable activation loop", 8);
  box(s, 86, 340, 1090, 4, C.olive);
  const phases = [
    ["RECRUIT", "10 × 5 cohorts", "Invite communities with a clear 8-minute test script."],
    ["ACTIVATE", "1 verified action", "Connect, fund, vote and copy the receipt."],
    ["LEARN", "Theme feedback", "Group friction by wallet, funding, vote and proof."],
  ];
  phases.forEach((phase, i) => {
    const x = 52 + i * 404;
    text(s, phase[0], x, 176, 340, 28, { size: 17, bold: true, color: C.olive });
    text(s, phase[1], x, 226, 340, 48, { size: 30, bold: true });
    box(s, x + 10, 312, 58, 58, i === 1 ? C.lime : C.oliveDark, "none", true);
    text(s, String(i + 1), x + 10, 324, 58, 30, { size: 22, bold: true, color: i === 1 ? C.ink : C.white, align: "center" });
    text(s, phase[2], x, 418, 340, 104, { size: 21, color: C.muted });
  });
  text(s, "Campaign guardrail: unique wallets and real StellarExpert-visible transactions only.", 150, 580, 980, 42, { size: 25, bold: true, align: "center" });
  notes(s, "Describe the campaign as a controlled product-learning exercise. The requested 2–3 minute interval is enforced in the tracker and validator, not simulated.");
}

// 9 — roadmap.
{
  const s = deck.slides.add(); s.background.fill = C.cream; title(s, "Every phase turns evidence into the next product decision", 9);
  const phases = [
    ["NOW", "Campaign readiness", "Guided onboarding\nShared wallet state\nReceipts + evidence workbook"],
    ["NEXT", "50-wallet validation", "Interval-controlled sessions\nActivation + error analysis\nFeedback-linked fixes"],
    ["THEN", "Retention", "Proposal subscriptions\nGovernance notifications\nCommunity-level analytics"],
  ];
  phases.forEach((phase, i) => {
    const x = 52 + i * 396;
    box(s, x, 176, 352, 390, i === 1 ? C.oliveDark : C.white, C.line, true);
    text(s, phase[0], x + 26, 204, 300, 26, { size: 17, bold: true, color: i === 1 ? C.lime : C.olive });
    text(s, phase[1], x + 26, 268, 300, 78, { size: 30, bold: true, color: i === 1 ? C.white : C.ink });
    text(s, phase[2], x + 26, 382, 300, 130, { size: 21, color: i === 1 ? C.white : C.muted });
  });
  notes(s, "The next feature decisions are conditional on observed tester friction. Avoid promising a roadmap detached from the evidence campaign.");
}

// 10 — close/action.
{
  const s = deck.slides.add(); s.background.fill = C.oliveDark;
  text(s, "THE DECISION", 54, 48, 420, 30, { size: 18, bold: true, color: C.lime });
  text(s, "Validate PollChain with 50 real wallets—and let the evidence choose the next build.", 54, 150, 880, 238, { size: 54, bold: true, color: C.white });
  box(s, 54, 480, 1172, 2, C.lime);
  text(s, "LIVE PRODUCT", 54, 520, 210, 24, { size: 16, bold: true, color: C.lime });
  text(s, "pollchain-orcin.vercel.app", 54, 556, 470, 34, { size: 22, color: C.white });
  text(s, "PUBLIC REPOSITORY", 680, 520, 260, 24, { size: 16, bold: true, color: C.lime });
  text(s, "github.com/jainamjodhawat/pollchain", 680, 556, 500, 34, { size: 22, color: C.white });
  text(s, "Owner: jainamjodhawat", 54, 646, 400, 24, { size: 16, color: C.panel });
  notes(s, "Close by asking reviewers to evaluate the live MVP and the evidence discipline, then return after the real user campaign with verified public transactions.", [
    "https://pollchain-orcin.vercel.app",
    "https://github.com/jainamjodhawat/pollchain",
  ]);
}

async function writeBlob(path, blob) {
  await fs.writeFile(path, new Uint8Array(await blob.arrayBuffer()));
}

await fs.mkdir(OUT, { recursive: true });
for (const [i, slide] of deck.slides.items.entries()) {
  const stem = `slide-${String(i + 1).padStart(2, "0")}`;
  await writeBlob(`${OUT}/${stem}.png`, await deck.export({ slide, format: "png", scale: 1 }));
  await fs.writeFile(`${OUT}/${stem}.layout.json`, await (await slide.export({ format: "layout" })).text());
}
await writeBlob(`${OUT}/PollChain_Level5_Pitch_Montage.webp`, await deck.export({ format: "webp", montage: true, scale: 1 }));
const pptx = await PresentationFile.exportPptx(deck);
await pptx.save(`${OUT}/PollChain_Level5_Pitch_Deck.pptx`);
