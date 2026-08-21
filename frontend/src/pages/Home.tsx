import { Link } from "react-router-dom";
import { Vote, Zap, Shield, Globe, ArrowRight, Users, CheckCircle2, Coins, FileText, Network, Gift } from "lucide-react";
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
            <span className="hero-title-gradient">
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
          <Link to="/onboarding" className="hero-onboarding-link">
            New to PollChain? Follow the three-minute testnet guide <ArrowRight size={14} />
          </Link>
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

        {/* Governance flow */}
        <section className="home-section home-flow-section">
          <div className="home-section-heading">
            <div>
              <div className="section-eyebrow">How PollChain works</div>
              <h2>From an idea to an on-chain decision</h2>
            </div>
            <p>
              PollChain keeps each stage of governance visible: who proposed,
              how the community voted, and what the approved decision executed.
            </p>
          </div>

          <div className="governance-flow">
            {[
              {
                step: "01",
                icon: <Coins size={20} />,
                title: "Get voting power",
                description: "Claim test POLL tokens from the faucet or receive delegated voting power from another holder.",
                to: "/faucet",
                cta: "Open faucet",
              },
              {
                step: "02",
                icon: <FileText size={20} />,
                title: "Put forward a proposal",
                description: "Add a clear title, context, and execution instructions so the community can make an informed decision.",
                to: "/create",
                cta: "Create proposal",
              },
              {
                step: "03",
                icon: <Vote size={20} />,
                title: "Vote, finalize, execute",
                description: "Votes are recorded on Stellar. Once a proposal meets quorum, it can be finalized for on-chain execution.",
                to: "/proposals",
                cta: "Browse proposals",
              },
            ].map((item) => (
              <article className="governance-step" key={item.step}>
                <div className="governance-step-topline">
                  <span>{item.step}</span>
                  <div className="governance-step-icon">{item.icon}</div>
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <Link to={item.to} className="governance-step-link">
                  {item.cta} <ArrowRight size={14} />
                </Link>
              </article>
            ))}
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
                icon: <Zap size={22} color="var(--color-olive)" />,
                title: "Near-Zero Fees",
                desc: "Stellar transactions cost ~$0.0007. Vote on every proposal without worrying about gas.",
              },
              {
                icon: <Shield size={22} color="var(--color-olive)" />,
                title: "Trustless Execution",
                desc: "Passed proposals execute automatically via Soroban smart contracts — no multisig delays.",
              },
              {
                icon: <Vote size={22} color="var(--color-olive)" />,
                title: "Token-Weighted Voting",
                desc: "Your POLL token balance determines your voting power. Transparent and on-chain.",
              },
              {
                icon: <Globe size={22} color="var(--color-olive)" />,
                title: "Any Community",
                desc: "Discord servers, student orgs, startups — any group can deploy their own DAO.",
              },
              {
                icon: <Users size={22} color="var(--color-olive)" />,
                title: "Quorum Protection",
                desc: "Proposals require minimum participation to pass, preventing low-turnout manipulation.",
              },
              {
                icon: <ArrowRight size={22} color="var(--color-olive)" />,
                title: "Inter-Contract Calls",
                desc: "Voting contract calls the Execution contract on-chain — true composability.",
              },
            ].map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h4 style={{ marginBottom: 8 }}>{f.title}</h4>
                <p style={{ fontSize: "0.875rem" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Governance safeguards */}
        <section className="home-section governance-safeguards">
          <div className="safeguard-copy">
            <div className="section-eyebrow">Built for accountable decisions</div>
            <h2>Every vote has context, weight, and a recorded outcome.</h2>
            <p>
              PollChain is designed for communities that want participation without
              losing the audit trail. The governance contract applies the same
              rules to every proposal and publishes the result on-chain.
            </p>
            <Link to="/about" className="btn btn-secondary">
              Explore the protocol <ArrowRight size={15} />
            </Link>
          </div>
          <div className="safeguard-list">
            {[
              { icon: <Shield size={18} />, title: "Quorum protection", text: "A proposal needs meaningful participation before it can pass." },
              { icon: <Network size={18} />, title: "Delegated governance", text: "Token holders can delegate their voting power without giving up ownership." },
              { icon: <Gift size={18} />, title: "Participation rewards", text: "Active voters can receive POLL rewards configured by the treasury." },
              { icon: <CheckCircle2 size={18} />, title: "Traceable execution", text: "Passed decisions can trigger connected contract actions with an on-chain record." },
            ].map((item) => (
              <div className="safeguard-item" key={item.title}>
                <div className="safeguard-icon">{item.icon}</div>
                <div>
                  <h4>{item.title}</h4>
                  <p>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
