import { useState, useEffect } from "react";
import { Trophy, TrendingUp } from "lucide-react";
import { useProposals } from "../hooks/useProposals";
import { fetchTokenBalance } from "../utils/contracts";
import { formatPoll, shortenAddress } from "../utils/stellar";

interface LeaderEntry {
  address: string;
  voteCount: number;
  balance: bigint;
}

export default function Leaderboard() {
  const { proposals, loading } = useProposals();
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loadingBalances, setLoadingBalances] = useState(false);

  useEffect(() => {
    if (proposals.length === 0) return;

    // Collect unique proposer addresses
    const addressSet = new Set<string>();
    proposals.forEach((p) => addressSet.add(p.proposer));
    const addresses = Array.from(addressSet);

    setLoadingBalances(true);
    Promise.all(
      addresses.map(async (addr) => {
        const balance = await fetchTokenBalance(addr).catch(() => 0n);
        const voteCount = proposals.filter((p) => p.proposer === addr).length;
        return { address: addr, voteCount, balance };
      })
    )
      .then((data) => {
        // Sort by vote count desc, then balance desc
        data.sort((a, b) =>
          b.voteCount !== a.voteCount
            ? b.voteCount - a.voteCount
            : Number(b.balance - a.balance)
        );
        setEntries(data);
      })
      .finally(() => setLoadingBalances(false));
  }, [proposals]);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: 720 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 64, height: 64, background: "var(--color-accent-lighter)", borderRadius: "var(--radius-xl)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Trophy size={28} color="var(--color-accent)" />
          </div>
          <h1 style={{ marginBottom: 8 }}>Leaderboard</h1>
          <p>Most active governance participants in PollChain.</p>
        </div>

        {/* Stats */}
        <div className="stats-row" style={{ marginBottom: 24 }}>
          <div className="stat-item">
            <div className="stat-value">{proposals.length}</div>
            <div className="stat-label">Total Proposals</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{entries.length}</div>
            <div className="stat-label">Active Proposers</div>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {loading || loadingBalances ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <div className="spinner" style={{ margin: "0 auto 12px" }} />
              <p>Loading leaderboard...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏆</div>
              <div className="empty-state-title">No data yet</div>
              <div className="empty-state-desc">Create proposals to appear on the leaderboard.</div>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--color-bg)", borderBottom: "1px solid var(--color-border)" }}>
                  {["Rank", "Address", "Proposals", "POLL Balance"].map((h) => (
                    <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-muted)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr key={e.address} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "14px 20px", fontWeight: 700, fontSize: "1.125rem" }}>
                      {medals[i] ?? `#${i + 1}`}
                    </td>
                    <td style={{ padding: "14px 20px", fontFamily: "monospace", fontSize: "0.875rem" }}>
                      {shortenAddress(e.address)}
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ background: "var(--color-accent-lighter)", color: "var(--color-accent)", padding: "2px 10px", borderRadius: "var(--radius-full)", fontSize: "0.8125rem", fontWeight: 600 }}>
                        {e.voteCount}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px", fontWeight: 600 }}>
                      {formatPoll(e.balance)} POLL
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
