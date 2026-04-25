import { Link } from "react-router-dom";
import { Vote, Zap, Shield, Globe, ArrowRight, Users } from "lucide-react";
import { useStats, useProposals } from "../hooks/useProposals";
import ProposalCard from "../components/ProposalCard";
import { formatPoll } from "../utils/stellar";

export default function Home() {
  const { proposals, loading } = useProposals();
  const stats = useStats(proposals);
  const activeProposals = proposals.filter((p) => p.status === "Active");

  return (
    <div style={{ position: "relative" }}>
      {/* Background orbs */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        {/* Hero */}
        <section className="hero">
          <div className="hero-eyebrow">
            <Zap size={12} />
            Powered by Stellar & Soroban
          </div>
          <h1 className="hero-title">
            Gasless On-Chain
            <br />
            <span style={{ color: "var(--color-accent)" }}>
              DAO Governance
            </span>
          </h1>
          <p className="hero-subtitle">
            Create proposals, vote with your POLL tokens, and execute decisions
            automatically — all on Stellar for fractions of a cent.
          </p>
          <div className="hero-actions">
            <Link to="/proposals" className="btn btn-primary btn-lg">
              View Proposals
              <ArrowRight size={16} />
            </Link>
            <Link to="/create" className="btn btn-secondary btn-lg">
              Create Proposal
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section style={{ marginBottom: 64 }}>
          <div className="stats-row">
            <div className="stat-item">
              <div className="stat-value">{stats.totalProposals}</div>
              <div className="stat-label">Total Proposals</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.activeProposals}</div>
              <div className="stat-label">Active Votes</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.executedProposals}</div>
              <div className="stat-label">Executed</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                {formatPoll(stats.totalVotesCast)}
              </div>
              <div className="stat-label">POLL Votes Cast</div>
            </div>
          </div>
        </section>

        {/* Active proposals */}
        <section style={{ marginBottom: 64 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <h2>Active Proposals</h2>
            <Link
              to="/proposals"
              className="btn btn-ghost btn-sm"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <div className="spinner" style={{ margin: "0 auto" }} />
            </div>
          ) : activeProposals.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🗳️</div>
              <div className="empty-state-title">No active proposals</div>
              <div className="empty-state-desc">
                Be the first to create a proposal for the community.
              </div>
              <Link to="/create" className="btn btn-primary">
                Create Proposal
              </Link>
            </div>
          ) : (
            <div className="proposals-grid">
              {activeProposals.map((p) => (
                <ProposalCard key={p.id} proposal={p} />
              ))}
            </div>
          )}
        </section>

        {/* Features */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ textAlign: "center", marginBottom: 40 }}>
            Why PollChain?
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 20,
            }}
          >
            {[
              {
                icon: <Zap size={24} color="var(--color-accent)" />,
                title: "Near-Zero Fees",
                desc: "Stellar transactions cost ~$0.0007. Vote on every proposal without worrying about gas.",
              },
              {
                icon: <Shield size={24} color="var(--color-accent)" />,
                title: "Trustless Execution",
                desc: "Passed proposals execute automatically via Soroban smart contracts — no multisig delays.",
              },
              {
                icon: <Vote size={24} color="var(--color-accent)" />,
                title: "Token-Weighted Voting",
                desc: "Your POLL token balance determines your voting power. Transparent and on-chain.",
              },
              {
                icon: <Globe size={24} color="var(--color-accent)" />,
                title: "Any Community",
                desc: "Discord servers, student orgs, startups — any group can deploy their own DAO.",
              },
              {
                icon: <Users size={24} color="var(--color-accent)" />,
                title: "Quorum Protection",
                desc: "Proposals require minimum participation to pass, preventing low-turnout manipulation.",
              },
              {
                icon: <ArrowRight size={24} color="var(--color-accent)" />,
                title: "Inter-Contract Calls",
                desc: "Voting contract calls the Execution contract on-chain — true composability.",
              },
            ].map((f, i) => (
              <div key={i} className="card" style={{ padding: 24 }}>
                <div style={{ marginBottom: 12 }}>{f.icon}</div>
                <h4 style={{ marginBottom: 8 }}>{f.title}</h4>
                <p style={{ fontSize: "0.875rem" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
