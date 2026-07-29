import { useState, useEffect } from "react";
import { Crown, FileText, Trophy, Users } from "lucide-react";
import { useProposals } from "../hooks/useProposals";
import { fetchTokenBalance } from "../utils/contracts";
import { formatPoll, shortenAddress } from "../utils/stellar";

interface LeaderEntry {
  address: string;
  proposalCount: number;
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
        const proposalCount = proposals.filter((p) => p.proposer === addr).length;
        return { address: addr, proposalCount, balance };
      })
    )
      .then((data) => {
        // Rank proposal authors by governance activity, then token balance.
        data.sort((a, b) =>
          b.proposalCount !== a.proposalCount
            ? b.proposalCount - a.proposalCount
            : Number(b.balance - a.balance)
        );
        setEntries(data);
      })
      .finally(() => setLoadingBalances(false));
  }, [proposals]);

  const medals = ["🥇", "🥈", "🥉"];
  const leaders = entries.slice(0, 3);

  return (
    <div className="page-wrapper">
      <div className="container leaderboard-page">
        <div className="leaderboard-hero">
          <div className="leaderboard-hero-icon">
            <Trophy size={28} color="var(--color-accent)" />
          </div>
          <div>
            <div className="leaderboard-eyebrow">Governance activity</div>
            <h1 style={{ marginBottom: 8 }}>Community leaderboard</h1>
            <p>Proposal authors shaping PollChain’s on-chain agenda.</p>
          </div>
        </div>

        <div className="stats-row leaderboard-stats">
          <div className="stat-item">
            <div className="stat-value">{proposals.length}</div>
            <div className="stat-label">Proposals created</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{entries.length}</div>
            <div className="stat-label">Proposal authors</div>
          </div>
        </div>

        {loading || loadingBalances ? (
          <div className="card leaderboard-loading">
            <div>
              <div className="spinner" style={{ margin: "0 auto 12px" }} />
              <p>Loading community activity...</p>
            </div>
          </div>
        ) : entries.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">🏆</div>
              <div className="empty-state-title">No activity yet</div>
              <div className="empty-state-desc">Create a proposal to become the first community leader.</div>
            </div>
          </div>
        ) : (
          <>
            <section className="leader-podium" aria-label="Top proposal authors">
              {leaders.map((entry, index) => (
                <article className={`leader-card leader-card-${index + 1}`} key={entry.address}>
                  <div className="leader-rank">{index === 0 ? <Crown size={18} /> : medals[index]}</div>
                  <div className="leader-address">{shortenAddress(entry.address)}</div>
                  <div className="leader-metric">
                    <strong>{entry.proposalCount}</strong>
                    proposal{entry.proposalCount === 1 ? "" : "s"}
                  </div>
                  <div className="leader-balance">{formatPoll(entry.balance)} POLL</div>
                </article>
              ))}
            </section>

            <section className="card leader-list" aria-label="All ranked proposal authors">
              <div className="leader-list-header">
                <div>
                  <h3>All contributors</h3>
                  <p>Ranked by proposals created, then POLL balance.</p>
                </div>
                <span className="leader-list-count"><Users size={14} /> {entries.length}</span>
              </div>
              <div className="leader-list-columns" aria-hidden="true">
                <span>Rank</span>
                <span>Wallet</span>
                <span>Activity</span>
                <span>Balance</span>
              </div>
              <div>
                {entries.map((entry, index) => (
                  <div className="leader-row" key={entry.address}>
                    <div className="leader-row-rank">{medals[index] ?? `#${index + 1}`}</div>
                    <div className="leader-row-address">
                      <span>{shortenAddress(entry.address)}</span>
                      <a
                        href={`https://stellar.expert/explorer/testnet/account/${entry.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View wallet
                      </a>
                    </div>
                    <div className="leader-row-activity"><FileText size={14} /> {entry.proposalCount}</div>
                    <div className="leader-row-balance">{formatPoll(entry.balance)} POLL</div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
