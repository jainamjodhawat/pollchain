import { useState, useEffect } from "react";
import {
  Landmark,
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
  ExternalLink,
  Activity,
  TrendingUp,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { useWallet } from "../hooks/useWallet";
import TransactionReceipt from "../components/TransactionReceipt";
import { fetchTreasuryBalance, fetchTreasuryTxs, depositTreasury } from "../utils/contracts";
import { formatPoll } from "../utils/stellar";
import { TOKEN_DECIMALS, TREASURY_CONTRACT_ID } from "../utils/constants";

interface TreasuryTx {
  kind: { tag: string };
  from_or_to: string;
  amount: bigint;
  ledger: number;
  timestamp: bigint;
}

// Realistically seeded sample data for high-quality analytics presentation
const SAMPLE_TXS: TreasuryTx[] = [
  { kind: { tag: "Deposit" }, from_or_to: "GD32A4K...VOTER1", amount: 150000000000n, ledger: 1024, timestamp: 1719381600n },
  { kind: { tag: "Deposit" }, from_or_to: "GB89JL...VOTER2", amount: 80000000000n, ledger: 1150, timestamp: 1719385200n },
  { kind: { tag: "Withdraw" }, from_or_to: "GC73MS...EXECUTION", amount: 50000000000n, ledger: 1210, timestamp: 1719388800n },
  { kind: { tag: "Deposit" }, from_or_to: "GD58KK...VOTER3", amount: 120000000000n, ledger: 1340, timestamp: 1719392400n },
  { kind: { tag: "Withdraw" }, from_or_to: "GB12PP...EXECUTION", amount: 90000000000n, ledger: 1480, timestamp: 1719396000n },
  { kind: { tag: "Deposit" }, from_or_to: "GD2X8K...VOTER4", amount: 140000000000n, ledger: 1600, timestamp: 1719399600n },
  { kind: { tag: "Withdraw" }, from_or_to: "GC47TL...EXECUTION", amount: 30000000000n, ledger: 1750, timestamp: 1719403200n },
  { kind: { tag: "Deposit" }, from_or_to: "GA98YY...VOTER5", amount: 200000000000n, ledger: 1910, timestamp: 1719406800n },
];

export default function Treasury() {
  const { wallet, connect } = useWallet();
  const [balance, setBalance] = useState<bigint>(0n);
  const [txs, setTxs] = useState<TreasuryTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositing, setDepositing] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Analytics Settings
  const [useSampleData, setUseSampleData] = useState(false);
  const [activeChart, setActiveChart] = useState<"trajectory" | "compare">("trajectory");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetchTreasuryBalance().then(setBalance),
      fetchTreasuryTxs().then((t) => {
        const sorted = (t as TreasuryTx[]).sort((a, b) => Number(a.timestamp - b.timestamp));
        setTxs(sorted);
        // Automatically switch to sample data if there are no on-chain transactions yet
        if (sorted.length === 0) {
          setUseSampleData(true);
        }
      }),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDeposit = async () => {
    if (!wallet.publicKey || !depositAmount) return;
    setDepositing(true);
    setError(null);
    setTxHash(null);
    try {
      const amount = BigInt(Math.round(parseFloat(depositAmount) * 10 ** TOKEN_DECIMALS));
      const hash = await depositTreasury(wallet.publicKey, amount);
      setTxHash(hash);
      setDepositAmount("");
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Deposit failed");
    } finally {
      setDepositing(false);
    }
  };

  // Determine current active transaction set
  const currentTxs = useSampleData ? SAMPLE_TXS : txs;
  const isDemoActive = useSampleData && txs.length === 0;

  // Process data for charts
  let cumulativeBalance = 0n;
  let totalDeposited = 0n;
  let totalWithdrawn = 0n;

  const chartPoints = currentTxs.map((tx, idx) => {
    const isDeposit = tx.kind?.tag === "Deposit";
    const amt = tx.amount;
    if (isDeposit) {
      cumulativeBalance += amt;
      totalDeposited += amt;
    } else {
      cumulativeBalance += -amt; // note: amount is positive, so subtract
      if (cumulativeBalance < 0n) cumulativeBalance = 0n;
      totalWithdrawn += amt;
    }
    return {
      index: idx,
      type: tx.kind?.tag,
      amount: amt,
      balanceAfter: cumulativeBalance,
      ledger: tx.ledger,
      timestamp: tx.timestamp,
    };
  });

  const displayBalance = useSampleData
    ? cumulativeBalance
    : balance;

  // SVG dimensions & mapping helpers for Line Chart
  const svgWidth = 680;
  const svgHeight = 240;
  const padding = { top: 30, right: 30, bottom: 40, left: 70 };

  const getLineCoordinates = () => {
    if (chartPoints.length === 0) return [];
    
    // Find min/max values for scaling
    const maxBal = chartPoints.reduce((max, p) => p.balanceAfter > max ? p.balanceAfter : max, 1000000000n);
    const minBal = 0n;
    const balanceRange = maxBal - minBal;

    const usableWidth = svgWidth - padding.left - padding.right;
    const usableHeight = svgHeight - padding.top - padding.bottom;

    return chartPoints.map((pt, i) => {
      const x = padding.left + (chartPoints.length > 1 ? (i / (chartPoints.length - 1)) * usableWidth : 0);
      const ratio = balanceRange > 0n ? Number(pt.balanceAfter - minBal) / Number(balanceRange) : 0.5;
      const y = padding.top + usableHeight - (ratio * usableHeight);
      return { x, y, pt };
    });
  };

  const coords = getLineCoordinates();

  // Create path command
  let linePath = "";
  let areaPath = "";
  if (coords.length > 0) {
    linePath = `M ${coords[0].x} ${coords[0].y} ` + coords.slice(1).map(c => `L ${c.x} ${c.y}`).join(" ");
    areaPath = `${linePath} L ${coords[coords.length - 1].x} ${svgHeight - padding.bottom} L ${coords[0].x} ${svgHeight - padding.bottom} Z`;
  }

  // Bar Chart calculations
  const totalDepositedNum = Number(totalDeposited) / 10 ** TOKEN_DECIMALS;
  const totalWithdrawnNum = Number(totalWithdrawn) / 10 ** TOKEN_DECIMALS;
  const maxBarValue = Math.max(totalDepositedNum, totalWithdrawnNum, 1);
  const barPadding = 120;
  const barWidth = 100;
  const usableBarHeight = 160;

  const depositBarHeight = (totalDepositedNum / maxBarValue) * usableBarHeight;
  const withdrawBarHeight = (totalWithdrawnNum / maxBarValue) * usableBarHeight;

  return (
    <div className="page-wrapper" style={{ position: "relative" }}>
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      <div className="container" style={{ maxWidth: 840, position: "relative", zIndex: 1 }}>
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 64,
            height: 64,
            background: "var(--color-accent-lighter)",
            borderRadius: "var(--radius-xl)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            boxShadow: "var(--shadow-sm)"
          }}>
            <Landmark size={28} color="var(--color-accent)" />
          </div>
          <h1 style={{ marginBottom: 8 }}>DAO Treasury</h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Community-owned POLL token reserve. Withdrawals are executed strictly through passed governance proposals.
          </p>
        </div>

        {/* Demo Alert banner */}
        {isDemoActive && (
          <div className="alert alert-info" style={{ marginBottom: 24, gap: 12, borderLeft: "4px solid var(--color-accent)" }}>
            <Sparkles size={16} />
            <div style={{ flex: 1 }}>
              <strong>Notice:</strong> Showing simulated treasury analytics because there are no transactions recorded on-chain yet.
            </div>
            {txs.length > 0 && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setUseSampleData(false)}
                style={{ padding: "4px 10px", background: "white" }}
              >
                Switch to Live
              </button>
            )}
          </div>
        )}

        {/* Balance Card */}
        <div className="card" style={{ padding: "32px 24px", textAlign: "center", marginBottom: 24, background: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(12px)" }}>
          {loading ? (
            <div className="spinner" style={{ margin: "0 auto" }} />
          ) : (
            <>
              <div style={{ fontSize: "3.5rem", fontWeight: 800, letterSpacing: "-0.04em", color: "var(--color-text-primary)", lineHeight: 1 }}>
                {formatPoll(displayBalance)}
              </div>
              <div style={{ color: "var(--color-text-muted)", fontWeight: 500, marginTop: 8, marginBottom: 16 }}>
                POLL in Treasury Balance {useSampleData ? "(Simulated)" : "(Live)"}
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
                <a
                  href={`https://stellar.expert/explorer/testnet/contract/${TREASURY_CONTRACT_ID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-sm"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "white" }}
                >
                  Stellar Explorer <ExternalLink size={12} />
                </a>
              </div>
            </>
          )}
        </div>

        {/* Interactive Charts Section */}
        <div className="card" style={{ padding: 24, marginBottom: 24, background: "rgba(255, 255, 255, 0.95)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Activity size={18} color="var(--color-accent)" />
              <h3 style={{ margin: 0 }}>Treasury Cash Flow Analytics</h3>
            </div>
            
            {/* Chart controls */}
            <div style={{ display: "flex", gap: 8, background: "var(--color-cream-dark)", padding: 4, borderRadius: 20 }}>
              <button
                className="btn btn-sm"
                onClick={() => setActiveChart("trajectory")}
                style={{
                  padding: "5px 12px",
                  fontSize: "0.75rem",
                  background: activeChart === "trajectory" ? "var(--color-charcoal)" : "transparent",
                  color: activeChart === "trajectory" ? "var(--color-cream)" : "var(--color-text-secondary)",
                }}
              >
                <TrendingUp size={12} style={{ marginRight: 4 }} /> Trajectory
              </button>
              <button
                className="btn btn-sm"
                onClick={() => setActiveChart("compare")}
                style={{
                  padding: "5px 12px",
                  fontSize: "0.75rem",
                  background: activeChart === "compare" ? "var(--color-charcoal)" : "transparent",
                  color: activeChart === "compare" ? "var(--color-cream)" : "var(--color-text-secondary)",
                }}
              >
                <BarChart3 size={12} style={{ marginRight: 4 }} /> Inflow vs Outflow
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <div style={{ padding: "12px 16px", background: "var(--color-cream-dark)", borderRadius: "var(--radius-md)", borderLeft: "4px solid var(--color-passed)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Cumulative Inflow</div>
              <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-passed)" }}>+{formatPoll(totalDeposited)} POLL</div>
            </div>
            <div style={{ padding: "12px 16px", background: "var(--color-cream-dark)", borderRadius: "var(--radius-md)", borderLeft: "4px solid var(--color-failed)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Cumulative Outflow</div>
              <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-failed)" }}>-{formatPoll(totalWithdrawn)} POLL</div>
            </div>
          </div>

          {/* Render Area/Line Trajectory Chart */}
          {activeChart === "trajectory" && (
            <div style={{ position: "relative", overflowX: "auto" }}>
              {chartPoints.length === 0 ? (
                <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
                  No transactions to chart.
                </div>
              ) : (
                <svg width={svgWidth} height={svgHeight} style={{ overflow: "visible", display: "block", margin: "0 auto" }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-olive)" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="var(--color-olive)" stopOpacity="0.00" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => {
                    const y = padding.top + r * (svgHeight - padding.top - padding.bottom);
                    return (
                      <line
                        key={idx}
                        x1={padding.left}
                        y1={y}
                        x2={svgWidth - padding.right}
                        y2={y}
                        stroke="var(--color-border)"
                        strokeDasharray="4 4"
                      />
                    );
                  })}

                  {/* X/Y Axes */}
                  <line
                    x1={padding.left}
                    y1={svgHeight - padding.bottom}
                    x2={svgWidth - padding.right}
                    y2={svgHeight - padding.bottom}
                    stroke="var(--color-border-strong)"
                    strokeWidth="1.5"
                  />
                  <line
                    x1={padding.left}
                    y1={padding.top}
                    x2={padding.left}
                    y2={svgHeight - padding.bottom}
                    stroke="var(--color-border-strong)"
                    strokeWidth="1.5"
                  />

                  {/* Area fill */}
                  {areaPath && <path d={areaPath} fill="url(#areaGrad)" />}

                  {/* Line path */}
                  {linePath && (
                    <path
                      d={linePath}
                      fill="none"
                      stroke="var(--color-olive)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Hover dots & click highlights */}
                  {coords.map((c, idx) => (
                    <g key={idx}>
                      <circle
                        cx={c.x}
                        cy={c.y}
                        r={hoveredIndex === idx ? 7 : 4}
                        fill={hoveredIndex === idx ? "var(--color-olive)" : "white"}
                        stroke="var(--color-olive)"
                        strokeWidth="2.5"
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        style={{ cursor: "pointer", transition: "all 0.15s ease-in-out" }}
                      />
                    </g>
                  ))}

                  {/* Y Axis Labels */}
                  <text x={padding.left - 12} y={padding.top + 4} textAnchor="end" fontSize="10" fill="var(--color-text-muted)">Max</text>
                  <text x={padding.left - 12} y={svgHeight - padding.bottom + 4} textAnchor="end" fontSize="10" fill="var(--color-text-muted)">0 POLL</text>

                  {/* X Axis Labels */}
                  {coords.map((c, i) => {
                    // Show only first, middle, last labels to prevent text overlaps
                    if (coords.length > 5 && i !== 0 && i !== coords.length - 1 && i !== Math.floor(coords.length / 2)) return null;
                    return (
                      <text
                        key={i}
                        x={c.x}
                        y={svgHeight - padding.bottom + 20}
                        textAnchor="middle"
                        fontSize="10"
                        fill="var(--color-text-muted)"
                      >
                        Tx #{ptLabel(c.pt)}
                      </text>
                    );
                  })}
                </svg>
              )}

              {/* Tooltip Overlay */}
              {hoveredIndex !== null && chartPoints[hoveredIndex] && (
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "var(--color-charcoal)",
                  color: "white",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-lg)",
                  fontSize: "0.8125rem",
                  zIndex: 10,
                  pointerEvents: "none",
                  border: "1px solid var(--color-border-strong)",
                  minWidth: 200
                }}>
                  <div style={{ fontWeight: 700, marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                    <span>Transaction #{hoveredIndex + 1}</span>
                    <span style={{ color: chartPoints[hoveredIndex].type === "Deposit" ? "#d1fae5" : "#fee2e2" }}>
                      {chartPoints[hoveredIndex].type}
                    </span>
                  </div>
                  <div>Amount: {formatPoll(chartPoints[hoveredIndex].amount)} POLL</div>
                  <div>Balance after: {formatPoll(chartPoints[hoveredIndex].balanceAfter)} POLL</div>
                  <div style={{ fontSize: "0.7rem", color: "#8a8a72", marginTop: 4 }}>
                    Ledger #{chartPoints[hoveredIndex].ledger}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Render Deposit vs Withdrawal Bar Chart */}
          {activeChart === "compare" && (
            <div style={{ height: 240, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: barPadding, paddingBottom: 40, paddingTop: 20, position: "relative" }}>
              {/* Deposit Bar */}
              <div
                style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}
                onMouseEnter={() => setHoveredIndex(0)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div style={{
                  width: barWidth,
                  height: depositBarHeight,
                  background: "var(--color-olive)",
                  borderRadius: "6px 6px 0 0",
                  transition: "height 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s",
                  opacity: hoveredIndex === 1 ? 0.6 : 1,
                  boxShadow: "0 4px 12px rgba(92,107,46,0.15)"
                }} />
                <span style={{ fontSize: "0.8125rem", fontWeight: 700, marginTop: 8, color: "var(--color-passed)" }}>Deposited</span>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{formatPoll(totalDeposited)} POLL</span>
              </div>

              {/* Withdrawal Bar */}
              <div
                style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}
                onMouseEnter={() => setHoveredIndex(1)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div style={{
                  width: barWidth,
                  height: withdrawBarHeight,
                  background: "var(--color-failed)",
                  borderRadius: "6px 6px 0 0",
                  transition: "height 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s",
                  opacity: hoveredIndex === 0 ? 0.6 : 1,
                  boxShadow: "0 4px 12px rgba(184,64,64,0.15)"
                }} />
                <span style={{ fontSize: "0.8125rem", fontWeight: 700, marginTop: 8, color: "var(--color-failed)" }}>Withdrawn</span>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{formatPoll(totalWithdrawn)} POLL</span>
              </div>

              {/* Bar Tooltip */}
              {hoveredIndex !== null && (hoveredIndex === 0 || hoveredIndex === 1) && (
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "var(--color-charcoal)",
                  color: "white",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-md)",
                  fontSize: "0.8125rem",
                  pointerEvents: "none",
                  textAlign: "center"
                }}>
                  {hoveredIndex === 0 ? (
                    <>
                      <strong>Total deposits:</strong> {formatPoll(totalDeposited)} POLL
                      <div style={{ fontSize: "0.7rem", color: "#8a8a72", marginTop: 2 }}>Average/growth analysis: positive inflow</div>
                    </>
                  ) : (
                    <>
                      <strong>Total withdrawals:</strong> {formatPoll(totalWithdrawn)} POLL
                      <div style={{ fontSize: "0.7rem", color: "#8a8a72", marginTop: 2 }}>Outflows spent on approved proposals</div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Toggle sample/live data button */}
          {txs.length > 0 && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setUseSampleData(!useSampleData);
                  setHoveredIndex(null);
                }}
                style={{ fontSize: "0.75rem", background: "white" }}
              >
                {useSampleData ? "Switch to Live Chain Data" : "Switch to Sample Analytics"}
              </button>
            </div>
          )}
        </div>

        {/* Deposit Card */}
        <div className="card" style={{ padding: 24, marginBottom: 24, background: "rgba(255, 255, 255, 0.95)" }}>
          <h4 style={{ marginBottom: 12 }}>Deposit to Treasury</h4>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: 16 }}>
            Top up the treasury reserves. Deposited tokens will be governed by community voting.
          </p>

          {!wallet.connected ? (
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", margin: 0 }}>Connect wallet to execute deposits.</p>
              <button className="btn btn-primary btn-sm" onClick={connect}>Connect Wallet</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  className="form-input"
                  type="number"
                  min="0.1"
                  step="any"
                  placeholder="Amount in POLL (e.g. 250)"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button className="btn btn-primary" onClick={handleDeposit} disabled={depositing || !depositAmount}>
                  {depositing ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Depositing...</> : "Deposit"}
                </button>
              </div>
              {txHash && (
                <TransactionReceipt action="Treasury deposit" hash={txHash} publicKey={wallet.publicKey} compact />
              )}
              {error && <div className="alert alert-error"><AlertCircle size={14} /> {error}</div>}
            </div>
          )}
        </div>

        {/* Transaction log */}
        <div className="card" style={{ padding: 0, overflow: "hidden", background: "rgba(255, 255, 255, 0.95)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Transaction Log History</span>
            <span style={{ fontSize: "0.75rem", background: "var(--color-cream-dark)", padding: "2px 8px", borderRadius: 10, color: "var(--color-text-secondary)" }}>
              {currentTxs.length} record{currentTxs.length !== 1 ? "s" : ""}
            </span>
          </div>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <div className="spinner" style={{ margin: "0 auto" }} />
            </div>
          ) : currentTxs.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
              No transactions recorded yet.
            </div>
          ) : (
            <div>
              {currentTxs.map((tx, i) => {
                const isDeposit = tx.kind?.tag === "Deposit";
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "14px 20px",
                      borderBottom: i < currentTxs.length - 1 ? "1px solid var(--color-border)" : "none",
                      background: hoveredIndex === i ? "var(--color-olive-pale)" : "transparent",
                      transition: "background 0.2s"
                    }}
                    onMouseEnter={() => activeChart === "trajectory" && setHoveredIndex(i)}
                    onMouseLeave={() => activeChart === "trajectory" && setHoveredIndex(null)}
                  >
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: isDeposit ? "#d1fae5" : "#fee2e2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      {isDeposit ? <ArrowDownLeft size={16} color="var(--color-passed)" /> : <ArrowUpRight size={16} color="var(--color-failed)" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem", display: "flex", justifyContent: "space-between" }}>
                        <span>{isDeposit ? "Deposit" : "Withdrawal (Proposal)"}</span>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontFamily: "monospace" }}>
                        {isDeposit ? "From: " : "To: "}{tx.from_or_to.slice(0, 10)}...{tx.from_or_to.slice(-6)}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, color: isDeposit ? "var(--color-passed)" : "var(--color-failed)" }}>
                        {isDeposit ? "+" : "-"}{formatPoll(tx.amount)} POLL
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        Ledger #{tx.ledger}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ptLabel(pt: { index: number; ledger: number }) {
  return `${pt.index + 1} (${pt.ledger})`;
}
