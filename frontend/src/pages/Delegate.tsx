import { useState, useEffect } from "react";
import {
  Users,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  GitMerge,
  Search,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { useWallet } from "../hooks/useWallet";
import { usePollBalance } from "../hooks/usePollBalance";
import {
  fetchDelegate,
  fetchVotingPower,
  delegateTo,
  undelegateVotes,
  fetchDelegators,
  fetchTokenBalance,
} from "../utils/contracts";
import { formatPoll, shortenAddress } from "../utils/stellar";

interface DelegatorInfo {
  address: string;
  balance: bigint;
}

// Sample delegation network for high-quality UI showcase
const SAMPLE_DELEGATORS: DelegatorInfo[] = [
  { address: "GD2X8K...VOTER_A", balance: 50000000000n }, // 5,000 POLL
  { address: "GB89JL...VOTER_B", balance: 35000000000n }, // 3,500 POLL
  { address: "GC73MS...VOTER_C", balance: 12000000000n }, // 1,200 POLL
  { address: "GD58KK...VOTER_D", balance: 7500000000n },  // 750 POLL
  { address: "GA39XX...VOTER_E", balance: 25000000000n }, // 2,500 POLL
];

export default function Delegate() {
  const { wallet, connect } = useWallet();
  const { balance } = usePollBalance(wallet.publicKey);
  const [currentDelegate, setCurrentDelegate] = useState<string | null>(null);
  const [votingPower, setVotingPower] = useState<bigint>(0n);
  const [delegateeInput, setDelegateeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Delegation Explorer State
  const [explorerAddress, setExplorerAddress] = useState("");
  const [searchedDelegate, setSearchedDelegate] = useState("");
  const [realDelegators, setRealDelegators] = useState<DelegatorInfo[]>([]);
  const [loadingExplorer, setLoadingExplorer] = useState(false);
  const [useSampleExplorer, setUseSampleExplorer] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<{
    address: string;
    balance: bigint;
    isDelegate: boolean;
    x: number;
    y: number;
  } | null>(null);

  // Load user's on-chain delegation state
  const loadUserDelegation = () => {
    if (!wallet.publicKey) return;
    fetchDelegate(wallet.publicKey).then(setCurrentDelegate);
    fetchVotingPower(wallet.publicKey).then(setVotingPower);
    
    // Default the Explorer to the logged-in user
    setSearchedDelegate(wallet.publicKey);
    setExplorerAddress(wallet.publicKey);
    loadIncomingDelegators(wallet.publicKey);
  };

  useEffect(() => {
    if (wallet.publicKey) {
      loadUserDelegation();
    } else {
      // Setup demo default if no wallet connected
      setUseSampleExplorer(true);
      setSearchedDelegate("GD_DEMO_DELEGATE_PRIMARY");
    }
  }, [wallet.publicKey]);

  // Load incoming delegators & balances
  const loadIncomingDelegators = async (address: string) => {
    setLoadingExplorer(true);
    try {
      const list = await fetchDelegators(address);
      const listWithBalances = await Promise.all(
        list.map(async (delegatorAddr) => {
          const bal = await fetchTokenBalance(delegatorAddr);
          return { address: delegatorAddr, balance: bal };
        })
      );
      setRealDelegators(listWithBalances);
      // Auto-toggle to sample if real list is empty
      if (listWithBalances.length === 0) {
        setUseSampleExplorer(true);
      } else {
        setUseSampleExplorer(false);
      }
    } catch (e) {
      console.error("Failed to load incoming delegators:", e);
    } finally {
      setLoadingExplorer(false);
    }
  };

  const handleDelegate = async () => {
    if (!wallet.publicKey || !delegateeInput.trim()) return;
    setLoading(true);
    setError(null);
    setTxHash(null);
    try {
      const hash = await delegateTo(wallet.publicKey, delegateeInput.trim());
      setTxHash(hash);
      setCurrentDelegate(delegateeInput.trim());
      setDelegateeInput("");
      loadUserDelegation();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  const handleUndelegate = async () => {
    if (!wallet.publicKey) return;
    setLoading(true);
    setError(null);
    setTxHash(null);
    try {
      const hash = await undelegateVotes(wallet.publicKey);
      setTxHash(hash);
      setCurrentDelegate(null);
      loadUserDelegation();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchExplorer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!explorerAddress.trim()) return;
    setSearchedDelegate(explorerAddress.trim());
    loadIncomingDelegators(explorerAddress.trim());
  };

  // Determine current active delegators set
  const currentDelegators = useSampleExplorer ? SAMPLE_DELEGATORS : realDelegators;
  const isDemoActive = useSampleExplorer && realDelegators.length === 0;

  // Calculate total power shown in explorer
  const explorerBaseBalance = searchedDelegate === wallet.publicKey ? balance : 5000n; // default base for others
  const totalExplorerPower = currentDelegators.reduce(
    (sum, d) => sum + d.balance,
    explorerBaseBalance * 10n ** 7n
  );

  // SVG Coordinates mapping for Radial Tree
  const svgWidth = 600;
  const svgHeight = 320;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;
  const radiusDistance = 110;

  const getNodes = () => {
    const nodes: {
      x: number;
      y: number;
      address: string;
      balance: bigint;
      isDelegate: boolean;
      r: number;
    }[] = [];

    // Add central delegate node
    nodes.push({
      x: centerX,
      y: centerY,
      address: searchedDelegate,
      balance: totalExplorerPower,
      isDelegate: true,
      r: 32,
    });

    // Add surrounding delegators
    const K = currentDelegators.length;
    currentDelegators.forEach((d, i) => {
      const angle = (2 * Math.PI * i) / (K || 1) - Math.PI / 2; // start from top
      const x = centerX + radiusDistance * Math.cos(angle);
      const y = centerY + radiusDistance * Math.sin(angle);
      
      // Node radius proportional to balance (between 12 and 22 px)
      const maxBal = currentDelegators.reduce((max, pt) => pt.balance > max ? pt.balance : max, 100000000000n);
      const ratio = maxBal > 0n ? Number(d.balance) / Number(maxBal) : 0.5;
      const r = 12 + ratio * 10;

      nodes.push({
        x,
        y,
        address: d.address,
        balance: d.balance,
        isDelegate: false,
        r,
      });
    });

    return nodes;
  };

  const nodes = getNodes();

  return (
    <div className="page-wrapper" style={{ position: "relative" }}>
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      <div className="container" style={{ maxWidth: 760, position: "relative", zIndex: 1 }}>
        
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
            <Users size={28} color="var(--color-accent)" />
          </div>
          <h1 style={{ marginBottom: 8 }}>Vote Delegation</h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Delegate your voting power to a trusted community representative, or manage delegations sent to you.
          </p>
        </div>

        {/* Info banner for Demo Explorer */}
        {isDemoActive && (
          <div className="alert alert-info" style={{ marginBottom: 24, gap: 12, borderLeft: "4px solid var(--color-accent)" }}>
            <Sparkles size={16} />
            <div style={{ flex: 1 }}>
              <strong>Visualization Notice:</strong> Showing simulated incoming delegators for demonstration of delegation structures.
            </div>
            {realDelegators.length > 0 && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setUseSampleExplorer(false)}
                style={{ padding: "4px 10px", background: "white" }}
              >
                Switch to Live
              </button>
            )}
          </div>
        )}

        {!wallet.connected ? (
          <div className="card" style={{ padding: 32, textAlign: "center", marginBottom: 24, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)" }}>
            <p style={{ marginBottom: 20 }}>Connect Freighter wallet to delegate power or check incoming support.</p>
            <button className="btn btn-primary" onClick={connect}>Connect Wallet</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            
            {/* Stats Row */}
            <div className="stats-row" style={{ background: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(8px)" }}>
              <div className="stat-item" style={{ background: "transparent" }}>
                <div className="stat-value">{formatPoll(balance)}</div>
                <div className="stat-label">Your POLL Balance</div>
              </div>
              <div className="stat-item" style={{ background: "transparent" }}>
                <div className="stat-value">{formatPoll(votingPower)}</div>
                <div className="stat-label">Total Voting Power (incl. delegated)</div>
              </div>
            </div>

            {/* Current delegation status */}
            <div className="card" style={{ padding: 24, background: "rgba(255, 255, 255, 0.95)" }}>
              <h4 style={{ marginBottom: 12 }}>Your Delegation Status</h4>
              {currentDelegate ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div className="alert alert-info" style={{ background: "var(--color-olive-pale)" }}>
                    <CheckCircle size={16} />
                    You are delegating your votes to{" "}
                    <strong style={{ fontFamily: "monospace", color: "var(--color-charcoal)" }}>
                      {shortenAddress(currentDelegate)}
                    </strong>
                  </div>
                  <button className="btn btn-danger" onClick={handleUndelegate} disabled={loading} style={{ alignSelf: "flex-start" }}>
                    {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Removing...</> : "Revoke Delegation"}
                  </button>
                </div>
              ) : (
                <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", margin: 0 }}>
                  You have not delegated your votes. Your POLL balance votes directly in active proposals.
                </p>
              )}
            </div>

            {/* Set Delegate Input */}
            <div className="card" style={{ padding: 24, background: "rgba(255, 255, 255, 0.95)" }}>
              <h4 style={{ marginBottom: 12 }}>
                {currentDelegate ? "Change Representative" : "Delegate Your Voting Power"}
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Representative Stellar Address</label>
                  <div style={{ display: "flex", gap: 10 }}>
                    <input
                      className="form-input"
                      placeholder="Enter G... address"
                      value={delegateeInput}
                      onChange={(e) => setExpandedDelegateInput(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={handleDelegate}
                      disabled={loading || !delegateeInput.trim() || delegateeInput.trim().length < 50}
                    >
                      {loading ? "Confirming..." : "Delegate Power"}
                    </button>
                  </div>
                  <span className="form-hint">
                    Power is dynamically calculated as your active POLL balance on-chain. You can revoke it anytime.
                  </span>
                </div>
                {txHash && (
                  <div className="alert alert-success">
                    <CheckCircle size={16} /> Delegation transaction recorded!{" "}
                    <a href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", fontWeight: 700 }}>
                      View transaction ↗
                    </a>
                  </div>
                )}
                {error && <div className="alert alert-error"><AlertCircle size={16} /> {error}</div>}
              </div>
            </div>

            {/* Delegation Structure Visualizer */}
            <div className="card" style={{ padding: 24, background: "rgba(255, 255, 255, 0.95)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <GitMerge size={20} color="var(--color-accent)" />
                <h3 style={{ margin: 0 }}>Delegation Structure Tree</h3>
              </div>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: 16 }}>
                Explore incoming vote flows. Search any address to view their delegator backing structure.
              </p>

              {/* Explorer Search Form */}
              <form onSubmit={handleSearchExplorer} style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                <input
                  className="form-input"
                  placeholder="GD... search delegate"
                  value={explorerAddress}
                  onChange={(e) => setExplorerAddress(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-secondary" style={{ padding: "0 16px" }}>
                  <Search size={16} />
                </button>
              </form>

              {/* Dynamic SVG Visualizer */}
              <div style={{ position: "relative", background: "var(--color-cream)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", overflow: "hidden", height: svgHeight }}>
                {loadingExplorer ? (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="spinner" />
                  </div>
                ) : (
                  <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ display: "block" }}>
                    <defs>
                      <marker id="arrow" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-text-muted)" />
                      </marker>
                    </defs>

                    {/* Connection paths */}
                    {nodes.slice(1).map((node, idx) => (
                      <line
                        key={idx}
                        x1={node.x}
                        y1={node.y}
                        x2={centerX}
                        y2={centerY}
                        stroke="var(--color-border-strong)"
                        strokeWidth="2"
                        strokeDasharray="4 2"
                        markerEnd="url(#arrow)"
                      />
                    ))}

                    {/* Nodes (Circles) */}
                    {nodes.map((node, idx) => {
                      const isHovered = hoveredNode?.address === node.address;
                      return (
                        <g
                          key={idx}
                          onMouseEnter={(e) => setHoveredNode({
                            address: node.address,
                            balance: node.balance,
                            isDelegate: node.isDelegate,
                            x: node.x,
                            y: node.y,
                          })}
                          onMouseLeave={() => setHoveredNode(null)}
                          style={{ cursor: "pointer" }}
                        >
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r={node.r + (isHovered ? 4 : 0)}
                            fill={node.isDelegate ? "var(--color-olive)" : "var(--color-sand-light)"}
                            stroke={node.isDelegate ? "var(--color-accent-dark)" : "var(--color-border-strong)"}
                            strokeWidth={isHovered ? 3 : 1.5}
                            style={{ transition: "all 0.15s ease" }}
                          />
                          <text
                            x={node.x}
                            y={node.y + (node.isDelegate ? 4 : 3)}
                            textAnchor="middle"
                            fontSize={node.isDelegate ? "10" : "8"}
                            fontWeight="bold"
                            fill={node.isDelegate ? "white" : "var(--color-charcoal)"}
                            pointerEvents="none"
                          >
                            {node.isDelegate ? "Delegate" : `${idx}`}
                          </text>
                          {/* Label below node */}
                          <text
                            x={node.x}
                            y={node.y + node.r + (isHovered ? 16 : 12)}
                            textAnchor="middle"
                            fontSize="9"
                            fill="var(--color-text-muted)"
                            fontWeight="500"
                            pointerEvents="none"
                          >
                            {shortenAddress(node.address)}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                )}

                {/* Floating Tooltip inside visualizer */}
                {hoveredNode && (
                  <div style={{
                    position: "absolute",
                    top: hoveredNode.y > svgHeight - 80 ? hoveredNode.y - 75 : hoveredNode.y + 20,
                    left: hoveredNode.x > svgWidth - 140 ? hoveredNode.x - 170 : hoveredNode.x + 10,
                    background: "var(--color-charcoal)",
                    color: "white",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-md)",
                    boxShadow: "var(--shadow-lg)",
                    fontSize: "0.75rem",
                    zIndex: 10,
                    pointerEvents: "none",
                    minWidth: 160
                  }}>
                    <div style={{ fontWeight: 700, color: hoveredNode.isDelegate ? "var(--color-olive-pale)" : "white" }}>
                      {hoveredNode.isDelegate ? "Primary Representative" : "Supporting Delegator"}
                    </div>
                    <div style={{ fontFamily: "monospace", fontSize: "0.6875rem", color: "#ccc" }}>
                      {hoveredNode.address}
                    </div>
                    <div style={{ marginTop: 4, fontWeight: 600 }}>
                      Voting Power: {formatPoll(hoveredNode.balance)} POLL
                    </div>
                  </div>
                )}
              </div>

              {/* Toggle Live/Sample Explorer */}
              {realDelegators.length > 0 && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setUseSampleExplorer(!useSampleExplorer);
                      setHoveredNode(null);
                    }}
                    style={{ fontSize: "0.75rem", background: "white" }}
                  >
                    {useSampleExplorer ? "Show Live Network Structure" : "Show Sample Network Structure"}
                  </button>
                </div>
              )}
            </div>

            {/* How Delegation Works */}
            <div className="card" style={{ padding: 20, background: "rgba(255, 255, 255, 0.95)" }}>
              <h4 style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <HelpCircle size={16} /> How Delegation Works
              </h4>
              <ul style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", paddingLeft: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                <li>Your POLL token balances are added to your designated delegate's total voting weight automatically.</li>
                <li>Your tokens stay completely in your custody. You can trade or transfer them at any point.</li>
                <li>You can update or remove your active delegation instantly on-chain without locking up tokens.</li>
                <li>Delegation empowers long-term representation, helping the DAO meet voting quorum.</li>
              </ul>
            </div>

          </div>
        )}
      </div>
    </div>
  );

  // Helper to safely bind input state without typescript conflicts
  function setExpandedDelegateInput(val: string) {
    setDelegateeInput(val);
  }
}
