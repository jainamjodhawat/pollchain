import fs from "node:fs/promises";
const { SpreadsheetFile, Workbook } = await import(
  process.env.POLLCHAIN_ARTIFACT_TOOL_MODULE ?? "@oai/artifact-tool"
);

const OUT = "docs/evidence/level5-workbook";
const wb = Workbook.create();
const intake = wb.worksheets.add("Private Intake");
const publicProof = wb.worksheets.add("Public Evidence");
const dashboard = wb.worksheets.add("Dashboard");
const instructions = wb.worksheets.add("Instructions");
const C = { dark: "#344018", olive: "#5A6A2E", lime: "#D7ED74", cream: "#F7F4E8", panel: "#E9ECD9", line: "#CCD1B7", white: "#FFFFFF", red: "#F4CCCC" };

for (const sheet of [intake, publicProof, dashboard, instructions]) sheet.showGridLines = false;

// Private intake: personal fields stay out of screenshots/public exports.
intake.getRange("A1:R1").merge();
intake.getRange("A1").values = [["PollChain Level 5 — Private Tester Intake"]];
intake.getRange("A2:R2").merge();
intake.getRange("A2").values = [["Do not publish names or email addresses. Paste only consented wallet and transaction evidence into the public sheet."]];
const headers = ["Tester ID", "Name (private)", "Email (private)", "Wallet Address", "Rating (1–5)", "Feedback Theme", "Feedback", "Interaction Type", "Transaction Hash", "StellarExpert URL", "Interaction Time", "Consent to Publish", "Unique Wallet", "Wallet Format", "Tx Format", "Interval (min)", "2–3 Min Interval", "Evidence Ready"];
intake.getRange("A4:R4").values = [headers];
const ids = Array.from({ length: 50 }, (_, i) => [`T-${String(i + 1).padStart(3, "0")}`]);
intake.getRange("A5:A54").values = ids;
intake.getRange("M5").formulas = [["=IF(D5=\"\",\"\",IF(COUNTIF($D$5:D5,D5)=1,\"YES\",\"DUPLICATE\"))"]];
intake.getRange("M5:M54").fillDown();
intake.getRange("N5").formulas = [["=IF(D5=\"\",\"\",IF(AND(LEN(D5)=56,LEFT(D5,1)=\"G\"),\"VALID\",\"CHECK\"))"]];
intake.getRange("N5:N54").fillDown();
intake.getRange("O5").formulas = [["=IF(I5=\"\",\"\",IF(LEN(I5)=64,\"VALID\",\"CHECK\"))"]];
intake.getRange("O5:O54").fillDown();
intake.getRange("P5").values = [[null]];
intake.getRange("P6").formulas = [["=IF(OR(K6=\"\",K5=\"\"),\"\",(K6-K5)*1440)"]];
intake.getRange("P6:P54").fillDown();
intake.getRange("Q5").values = [[null]];
intake.getRange("Q6").formulas = [["=IF(P6=\"\",\"\",IF(AND(P6>=2,P6<=3),\"YES\",\"CHECK\"))"]];
intake.getRange("Q6:Q54").fillDown();
intake.getRange("R5").formulas = [["=IF(D5=\"\",\"\",IF(AND(L5=\"YES\",M5=\"YES\",N5=\"VALID\",O5=\"VALID\"),\"READY\",\"INCOMPLETE\"))"]];
intake.getRange("R5:R54").fillDown();
intake.getRange("E5:E54").dataValidation = { rule: { type: "whole", operator: "between", formula1: 1, formula2: 5 } };
intake.getRange("F5:F54").dataValidation = { rule: { type: "list", values: ["Wallet", "Funding", "Navigation", "Voting", "Proof", "Performance", "Other"] } };
intake.getRange("H5:H54").dataValidation = { rule: { type: "list", values: ["Faucet claim", "Create proposal", "Vote", "Delegate", "Treasury action"] } };
intake.getRange("L5:L54").dataValidation = { rule: { type: "list", values: ["YES", "NO"] } };
intake.getRange("K5:K54").setNumberFormat("yyyy-mm-dd hh:mm:ss");
intake.getRange("P5:P54").setNumberFormat("0.00");
intake.freezePanes.freezeRows(4);
intake.freezePanes.freezeColumns(1);
intake.getRange("A1:R1").format = { fill: C.dark, font: { color: C.white, bold: true, size: 18 } };
intake.getRange("A2:R2").format = { fill: C.cream, font: { color: C.olive, italic: true }, wrapText: true };
intake.getRange("A4:R4").format = { fill: C.olive, font: { color: C.white, bold: true }, wrapText: true, borders: { preset: "outside", style: "thin", color: C.dark } };
intake.getRange("A5:R54").format.borders = { insideHorizontal: { style: "thin", color: C.line } };
intake.getRange("M5:R54").format.fill = C.cream;
intake.getRange("A1:R54").format.rowHeight = 22;
intake.getRange("A1:R1").format.rowHeight = 34;
intake.getRange("A2:R2").format.rowHeight = 40;
intake.getRange("A4:R4").format.rowHeight = 42;
const widths = [13, 20, 25, 24, 12, 16, 32, 18, 24, 30, 20, 18, 16, 16, 14, 14, 18, 18];
widths.forEach((width, i) => { intake.getRangeByIndexes(0, i, 54, 1).format.columnWidth = width; });

// Public evidence uses only non-personal fields and formula links.
publicProof.getRange("A1:L1").merge();
publicProof.getRange("A1").values = [["PollChain Level 5 — Public Transaction Evidence"]];
publicProof.getRange("A2:L2").merge();
publicProof.getRange("A2").values = [["Formula-backed view. Rows appear as the private intake sheet is completed; names and emails are intentionally excluded."]];
const publicHeaders = ["Tester ID", "Wallet Address", "Rating", "Feedback Theme", "Interaction Type", "Transaction Hash", "StellarExpert URL", "Interaction Time", "Unique Wallet", "Interval (min)", "Interval Check", "Evidence Status"];
publicProof.getRange("A4:L4").values = [publicHeaders];
for (let row = 5; row <= 54; row += 1) {
  publicProof.getRange(`A${row}:L${row}`).formulas = [[
    `='Private Intake'!A${row}`,
    `=IF('Private Intake'!D${row}=\"\",\"\",'Private Intake'!D${row})`,
    `=IF('Private Intake'!D${row}=\"\",\"\",'Private Intake'!E${row})`,
    `=IF('Private Intake'!D${row}=\"\",\"\",'Private Intake'!F${row})`,
    `=IF('Private Intake'!D${row}=\"\",\"\",'Private Intake'!H${row})`,
    `=IF('Private Intake'!D${row}=\"\",\"\",'Private Intake'!I${row})`,
    `=IF('Private Intake'!D${row}=\"\",\"\",'Private Intake'!J${row})`,
    `=IF('Private Intake'!D${row}=\"\",\"\",'Private Intake'!K${row})`,
    `=IF('Private Intake'!D${row}=\"\",\"\",'Private Intake'!M${row})`,
    `=IF('Private Intake'!D${row}=\"\",\"\",'Private Intake'!P${row})`,
    `=IF('Private Intake'!D${row}=\"\",\"\",'Private Intake'!Q${row})`,
    `=IF('Private Intake'!D${row}=\"\",\"\",'Private Intake'!R${row})`,
  ]];
}
publicProof.getRange("H5:H54").setNumberFormat("yyyy-mm-dd hh:mm:ss");
publicProof.getRange("J5:J54").setNumberFormat("0.00");
publicProof.freezePanes.freezeRows(4);
publicProof.getRange("A1:L1").format = { fill: C.dark, font: { color: C.white, bold: true, size: 18 } };
publicProof.getRange("A2:L2").format = { fill: C.cream, font: { color: C.olive, italic: true }, wrapText: true };
publicProof.getRange("A4:L4").format = { fill: C.olive, font: { color: C.white, bold: true }, wrapText: true };
publicProof.getRange("A5:L54").format.borders = { insideHorizontal: { style: "thin", color: C.line } };
publicProof.getRange("A1:L54").format.rowHeight = 22;
publicProof.getRange("A4:L4").format.rowHeight = 40;
[13, 24, 10, 18, 18, 24, 30, 20, 16, 14, 16, 18].forEach((width, i) => { publicProof.getRangeByIndexes(0, i, 54, 1).format.columnWidth = width; });

// Dashboard: all metrics are formula-driven from the intake sheet.
dashboard.getRange("A1:L1").merge(); dashboard.getRange("A1").values = [["PollChain Level 5 — Campaign Dashboard"]];
dashboard.getRange("A3:C3").merge(); dashboard.getRange("D3:F3").merge(); dashboard.getRange("G3:I3").merge(); dashboard.getRange("J3:L3").merge();
dashboard.getRange("A3").values = [["Unique wallets"]]; dashboard.getRange("D3").values = [["Evidence ready"]]; dashboard.getRange("G3").values = [["Average rating"]]; dashboard.getRange("J3").values = [["Interval compliance"]];
dashboard.getRange("A4:C6").merge(); dashboard.getRange("D4:F6").merge(); dashboard.getRange("G4:I6").merge(); dashboard.getRange("J4:L6").merge();
dashboard.getRange("A4").formulas = [["=COUNTIF('Private Intake'!M5:M54,\"YES\")"]];
dashboard.getRange("D4").formulas = [["=COUNTIF('Private Intake'!R5:R54,\"READY\")"]];
dashboard.getRange("G4").formulas = [["=IFERROR(AVERAGE('Private Intake'!E5:E54),0)"]];
dashboard.getRange("J4").formulas = [["=IFERROR(COUNTIF('Private Intake'!Q6:Q54,\"YES\")/COUNT('Private Intake'!P6:P54),0)"]];
dashboard.getRange("A8:L8").merge(); dashboard.getRange("A8").formulas = [["=IF(A4>=50,\"TARGET MET — 50 UNIQUE WALLETS\",\"PENDING — \"&(50-A4)&\" UNIQUE WALLETS REMAIN\")"]];
dashboard.getRange("A10:B17").values = [["Feedback theme", "Count"], ["Wallet", null], ["Funding", null], ["Navigation", null], ["Voting", null], ["Proof", null], ["Performance", null], ["Other", null]];
dashboard.getRange("B11").formulas = [["=COUNTIF('Private Intake'!F5:F54,A11)"]]; dashboard.getRange("B11:B17").fillDown();
dashboard.getRange("D10:E15").values = [["Rating", "Count"], [1, null], [2, null], [3, null], [4, null], [5, null]];
dashboard.getRange("E11").formulas = [["=COUNTIF('Private Intake'!E5:E54,D11)"]]; dashboard.getRange("E11:E15").fillDown();
dashboard.getRange("A1:L1").format = { fill: C.dark, font: { color: C.white, bold: true, size: 20 } };
dashboard.getRange("A3:L3").format = { fill: C.olive, font: { color: C.white, bold: true }, horizontalAlignment: "center" };
dashboard.getRange("A4:L6").format = { fill: C.cream, font: { color: C.dark, bold: true, size: 26 }, horizontalAlignment: "center", verticalAlignment: "center", borders: { preset: "outside", style: "thin", color: C.line } };
dashboard.getRange("J4:L6").setNumberFormat("0%"); dashboard.getRange("G4:I6").setNumberFormat("0.0");
dashboard.getRange("A8:L8").format = { fill: C.lime, font: { color: C.dark, bold: true, size: 16 }, horizontalAlignment: "center" };
dashboard.getRange("A10:B10").format = { fill: C.olive, font: { color: C.white, bold: true } }; dashboard.getRange("D10:E10").format = { fill: C.olive, font: { color: C.white, bold: true } };
dashboard.getRange("A10:B17").format.borders = { insideHorizontal: { style: "thin", color: C.line } }; dashboard.getRange("D10:E15").format.borders = { insideHorizontal: { style: "thin", color: C.line } };
dashboard.getRange("A1:L18").format.columnWidth = 13; dashboard.getRange("A1:L1").format.rowHeight = 36; dashboard.getRange("A4:L6").format.rowHeight = 34;
const themeChart = dashboard.charts.add("bar", dashboard.getRange("A10:B17"));
themeChart.title = "Where testers experience friction"; themeChart.hasLegend = false; themeChart.xAxis = { axisType: "textAxis" }; themeChart.yAxis = { numberFormatCode: "0" }; themeChart.setPosition("G10", "L22");

// Instructions.
instructions.getRange("A1:H1").merge(); instructions.getRange("A1").values = [["How to Run the 50-Wallet Evidence Campaign"]];
const rows = [
  ["1", "Recruit real testers", "Use 10 cohorts of five. One human-controlled Stellar testnet wallet per row."],
  ["2", "Keep the interval", "Start each interaction 2–3 minutes after the previous timestamp. The workbook calculates the interval."],
  ["3", "Capture proof", "Record transaction hash, StellarExpert URL, wallet and timestamp. Never record secret keys or seed phrases."],
  ["4", "Collect consent", "Names and emails remain private. Publish wallet evidence only when the tester explicitly consents."],
  ["5", "Verify before claiming", "The dashboard must show 50 unique wallets and 50 evidence-ready rows. Run the repository validator too."],
];
instructions.getRange("A3:H3").values = [["Step", "Action", "Rule", null, null, null, null, null]];
rows.forEach((row, i) => {
  const r = 4 + i * 3; instructions.getRange(`A${r}:A${r + 1}`).merge(); instructions.getRange(`B${r}:C${r + 1}`).merge(); instructions.getRange(`D${r}:H${r + 1}`).merge();
  instructions.getRange(`A${r}`).values = [[row[0]]]; instructions.getRange(`B${r}`).values = [[row[1]]]; instructions.getRange(`D${r}`).values = [[row[2]]];
});
instructions.getRange("A1:H1").format = { fill: C.dark, font: { color: C.white, bold: true, size: 20 } };
instructions.getRange("A1:H1").format.rowHeight = 38;
instructions.getRange("A3:H3").format = { fill: C.olive, font: { color: C.white, bold: true } };
instructions.getRange("A4:H18").format = { fill: C.cream, wrapText: true, verticalAlignment: "center", borders: { insideHorizontal: { style: "thin", color: C.line } } };
instructions.getRange("A4:A18").format = { fill: C.lime, font: { bold: true, size: 20 }, horizontalAlignment: "center", verticalAlignment: "center" };
instructions.getRange("A1:H18").format.columnWidth = 14; instructions.getRange("B1:C18").format.columnWidth = 20; instructions.getRange("D1:H18").format.columnWidth = 18; instructions.getRange("A4:H18").format.rowHeight = 28;

await fs.mkdir(OUT, { recursive: true });
for (const name of ["Dashboard", "Private Intake", "Public Evidence", "Instructions"]) {
  const preview = await wb.render({ sheetName: name, autoCrop: "all", scale: 1, format: "png" });
  await fs.writeFile(`${OUT}/${name.replaceAll(" ", "-").toLowerCase()}.png`, new Uint8Array(await preview.arrayBuffer()));
}
const output = await SpreadsheetFile.exportXlsx(wb);
await output.save(`${OUT}/PollChain_Level5_User_Analysis.xlsx`);
const inspection = await wb.inspect({ kind: "workbook,sheet,formula,drawing", maxChars: 12000, tableMaxRows: 8, tableMaxCols: 8 });
await fs.writeFile(`${OUT}/inspection.ndjson`, inspection.ndjson);
