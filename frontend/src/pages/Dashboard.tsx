import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { User, Vote, TrendingUp, ExternalLink } from "lucide-react";
import { useWallet } from "../hooks/useWallet";
import { usePollBalance } from "../hooks/usePollBalance";
import { useProposals } from "../hooks/useProposals";
import { fetchVote, fetchVotingPower } from "../utils/contracts";
import { formatPoll, shortenAddress, statusColor, statusLabel } from "../utils/stellar";

export default function Dashboard() {
  const { wallet, connect } = useWallet();
  const { balance } = usePollBalance(wallet.publicKey);
  const { proposals, loading } = useProposals();
  const [myVotes, setMyVotes] = useState<Record<number, string>>({});
  const [votingPower, setVotingPower] = useState<bigint>(0n);
  const [loadingVotes, setLoadingVotes] = useState(false);

  const myProposals = proposals.filter(
    (p) => wallet.publicKey && p.proposer === wallet.publicKey
  );

  useEffect(() => {
    if (!wallet.publicKey || proposals.length === 0) return;
    setLoadingVotes(true);
    const pk = wallet.publicKey;

    fetchVotingPower(pk).then(setVotingPower).catch(() => {});

    Promise.all(
      proposals.map(async (p) => {
        const vote = await fetchVote(p.id, pk);
        return { id: p.id, choice: vote?.tag ?? null };
      })
    ).then((results) => {
      const map: Record<number, string> = {};
      results.forEach(({ id, choice }) => {
        if (choice) map[id] = choice;
      });
      setMyVotes(map);
    }).finally(() => setLoadingVotes(false));
  }, [wallet.publicKey, proposals]);

  if (!wallet.connected) {
    return (
      <div className="page-wrapper">
        <div className="container">
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <div className="empty-state-title">Connect your wallet</div>
            <div className="empty-state-desc">
              Connect Freighter to see your governance activity.
            </div>
            <button className="btn btn-primary" onClick={connect}>
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  const votedProposals = proposals.filter((p) => myVotes[p.id]);

  return (
    <div className="page-wrapper">
      <div className="container">
        <h1 style={{ marginBottom: 8 }}>Dashboard</h1>
        <p style={{ marginBottom: 32 }}>
          Your governance activity for{" "}
          <span style={{ fontWeight: 600, color: "var(--color-accent)" }}>
            {shortenAddress(wallet.publicKey!)}
          </span>
        </p>

        {/* Stats */}
        <div className="stats-row" style={{ marginBottom: 32 }}>
          <div className="stat-item">
            <div className="stat-value">{formatPoll(balance)}</div>
            <div className="stat-label">POLL Balance</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{formatPoll(votingPower)}</div>
            <div className="stat-label">Voting Power (incl. delegated)</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{myProposals.length}</div>
            <div className="stat-label">Proposals Created</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{votedProposals.length}</div>
            <div className="stat-label">Proposals Voted</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* My Proposals */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <TrendingUp size={18} color="var(--color-accent)" />
              <h3>My Proposals</h3>
            </div>
            {loading ? (
              <div className="spinner" style={{ margin: "20px auto" }} />
            ) : myProposals.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
                No proposals yet.{" "}
                <Link to="/create" style={{ color: "var(--color-accent)" }}>
                  Create one
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {myProposals.map((p) => (
                  <Link
                    key={p.id}
                    to={`/proposals/${p.id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      style={{
                        padding: "12px 14px",
                        background: "var(--color-bg)",
                        borderRadius: "var(--radius-md)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-primary)" }}>
                          #{p.id} {p.title.slice(0, 40)}{p.title.length > 40 ? "..." : ""}
                        </div>
                      </div>
                      <span className={`badge ${statusColor(p.status)}`}>
                        {statusLabel(p.status)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* My Votes */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <Vote size={18} color="var(--color-accent)" />
              <h3>My Votes</h3>
            </div>
            {loading || loadingVotes ? (
              <div className="spinner" style={{ margin: "20px auto" }} />
            ) : votedProposals.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
                No votes cast yet.{" "}
                <Link to="/proposals" style={{ color: "var(--color-accent)" }}>
                  Browse proposals
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {votedProposals.map((p) => {
                  const choice = myVotes[p.id];
                  const choiceColor = choice === "Yes" ? "var(--color-passed)" : choice === "No" ? "var(--color-failed)" : "var(--color-text-muted)";
                  return (
                    <Link key={p.id} to={`/proposals/${p.id}`} style={{ textDecoration: "none" }}>
                      <div style={{ padding: "12px 14px", background: "var(--color-bg)", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-primary)" }}>
                          #{p.id} {p.title.slice(0, 36)}{p.title.length > 36 ? "..." : ""}
                        </div>
                        <span style={{ fontWeight: 700, fontSize: "0.8125rem", color: choiceColor }}>
                          {choice}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
          <Link to="/faucet" className="btn btn-secondary">Get POLL Tokens</Link>
          <Link to="/delegate" className="btn btn-secondary">Manage Delegation</Link>
          <Link to="/create" className="btn btn-primary">Create Proposal</Link>
        </div>
      </div>
    </div>
  );
}
