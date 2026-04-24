import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  User,
  CheckCircle,
  XCircle,
  MinusCircle,
  Code,
  AlertCircle,
} from "lucide-react";
import { useProposals } from "../hooks/useProposals";
import { useWallet } from "../hooks/useWallet";
import VoteModal from "../components/VoteModal";
import {
  formatPoll,
  shortenAddress,
  statusColor,
  statusLabel,
  votePercentage,
} from "../utils/stellar";

export default function ProposalDetail() {
  const { id } = useParams<{ id: string }>();
  const { getProposal, loading } = useProposals();
  const { wallet, connect } = useWallet();
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [userVote, setUserVote] = useState<string | null>(null);

  const proposal = getProposal(Number(id));

  const handleVote = async (choice: "Yes" | "No" | "Abstain") => {
    // Simulate transaction
    await new Promise((r) => setTimeout(r, 1500));
    setUserVote(choice);
    setShowVoteModal(false);
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="container" style={{ textAlign: "center", paddingTop: 80 }}>
          <div className="spinner" style={{ margin: "0 auto 16px" }} />
          <p>Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="page-wrapper">
        <div className="container">
          <div className="empty-state">
            <div className="empty-state-icon">❓</div>
            <div className="empty-state-title">Proposal not found</div>
            <div className="empty-state-desc">
              This proposal doesn't exist or has been removed.
            </div>
            <Link to="/proposals" className="btn btn-primary">
              Back to Proposals
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const pct = votePercentage(
    proposal.yes_votes,
    proposal.no_votes,
    proposal.abstain_votes
  );
  const totalVotes =
    proposal.yes_votes + proposal.no_votes + proposal.abstain_votes;
  const isActive = proposal.status === "Active";

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Back */}
        <Link
          to="/proposals"
          className="btn btn-ghost btn-sm"
          style={{ marginBottom: 24, display: "inline-flex" }}
        >
          <ArrowLeft size={14} />
          Back to Proposals
        </Link>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: 24,
            alignItems: "start",
          }}
        >
          {/* Main content */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Header card */}
            <div className="card" style={{ padding: 28 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 16,
                }}
              >
                <span
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--color-text-muted)",
                  }}
                >
                  Proposal #{proposal.id}
                </span>
                <span className={`badge ${statusColor(proposal.status)}`}>
                  {statusLabel(proposal.status)}
                </span>
              </div>
              <h2 style={{ marginBottom: 16 }}>{proposal.title}</h2>
              <p style={{ lineHeight: 1.7, marginBottom: 20 }}>
                {proposal.description}
              </p>
              <div className="divider" />
              <div
                style={{
                  display: "flex",
                  gap: 24,
                  flexWrap: "wrap",
                  fontSize: "0.875rem",
                  color: "var(--color-text-muted)",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <User size={14} />
                  Proposer: {shortenAddress(proposal.proposer)}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Clock size={14} />
                  Voting ends: Ledger #{proposal.end_ledger}
                </span>
              </div>
            </div>

            {/* Vote results */}
            <div className="card" style={{ padding: 28 }}>
              <h3 style={{ marginBottom: 20 }}>Vote Results</h3>

              {totalVotes === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "32px 0",
                    color: "var(--color-text-muted)",
                  }}
                >
                  No votes cast yet. Be the first to vote!
                </div>
              ) : (
                <>
                  {/* Bar */}
                  <div className="vote-bar-container" style={{ height: 12, marginBottom: 16 }}>
                    <div
                      className="vote-bar-yes"
                      style={{ width: `${pct.yes}%` }}
                    />
                    <div
                      className="vote-bar-no"
                      style={{ width: `${pct.no}%` }}
                    />
                    <div
                      className="vote-bar-abstain"
                      style={{ width: `${pct.abstain}%` }}
                    />
                  </div>

                  {/* Breakdown */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 12,
                    }}
                  >
                    {[
                      {
                        label: "Yes",
                        votes: proposal.yes_votes,
                        pct: pct.yes,
                        color: "var(--color-passed)",
                        bg: "#d1fae5",
                        icon: <CheckCircle size={16} />,
                      },
                      {
                        label: "No",
                        votes: proposal.no_votes,
                        pct: pct.no,
                        color: "var(--color-failed)",
                        bg: "#fee2e2",
                        icon: <XCircle size={16} />,
                      },
                      {
                        label: "Abstain",
                        votes: proposal.abstain_votes,
                        pct: pct.abstain,
                        color: "var(--color-text-secondary)",
                        bg: "#f3f4f6",
                        icon: <MinusCircle size={16} />,
                      },
                    ].map((v) => (
                      <div
                        key={v.label}
                        style={{
                          background: v.bg,
                          borderRadius: "var(--radius-md)",
                          padding: "14px 16px",
                          color: v.color,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            marginBottom: 6,
                            fontWeight: 600,
                            fontSize: "0.875rem",
                          }}
                        >
                          {v.icon}
                          {v.label}
                        </div>
                        <div
                          style={{
                            fontSize: "1.25rem",
                            fontWeight: 800,
                            letterSpacing: "-0.02em",
                          }}
                        >
                          {v.pct}%
                        </div>
                        <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>
                          {formatPoll(v.votes)} POLL
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      marginTop: 16,
                      fontSize: "0.875rem",
                      color: "var(--color-text-muted)",
                      textAlign: "center",
                    }}
                  >
                    Total: {formatPoll(totalVotes)} POLL voted
                  </div>
                </>
              )}
            </div>

            {/* Calldata */}
            <div className="card" style={{ padding: 28 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                <Code size={18} color="var(--color-accent)" />
                <h3>Execution Calldata</h3>
              </div>
              <pre
                style={{
                  background: "#0f0f0f",
                  color: "#e5e7eb",
                  padding: 16,
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.8125rem",
                  overflowX: "auto",
                  lineHeight: 1.6,
                }}
              >
                {JSON.stringify(JSON.parse(proposal.calldata), null, 2)}
              </pre>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Vote action */}
            <div className="card" style={{ padding: 24 }}>
              <h4 style={{ marginBottom: 16 }}>Cast Your Vote</h4>

              {userVote ? (
                <div className="alert alert-success">
                  <CheckCircle size={16} />
                  You voted <strong>{userVote}</strong>
                </div>
              ) : !isActive ? (
                <div className="alert alert-info">
                  <AlertCircle size={16} />
                  Voting has ended for this proposal.
                </div>
              ) : !wallet.connected ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <p style={{ fontSize: "0.875rem" }}>
                    Connect your Freighter wallet to vote.
                  </p>
                  <button className="btn btn-primary" onClick={connect}>
                    Connect Wallet
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <p style={{ fontSize: "0.875rem" }}>
                    Your vote is weighted by your POLL token balance.
                  </p>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowVoteModal(true)}
                  >
                    Vote Now
                  </button>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="card" style={{ padding: 24 }}>
              <h4 style={{ marginBottom: 16 }}>Proposal Info</h4>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  fontSize: "0.875rem",
                }}
              >
                {[
                  { label: "Status", value: statusLabel(proposal.status) },
                  { label: "Proposal ID", value: `#${proposal.id}` },
                  {
                    label: "Proposer",
                    value: shortenAddress(proposal.proposer),
                  },
                  { label: "Start Ledger", value: `#${proposal.start_ledger}` },
                  { label: "End Ledger", value: `#${proposal.end_ledger}` },
                  {
                    label: "Total Votes",
                    value: `${formatPoll(totalVotes)} POLL`,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <span style={{ color: "var(--color-text-muted)" }}>
                      {item.label}
                    </span>
                    <span style={{ fontWeight: 600, textAlign: "right" }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vote modal */}
      {showVoteModal && (
        <VoteModal
          proposal={proposal}
          onClose={() => setShowVoteModal(false)}
          onVote={handleVote}
          votingPower={1000_0000000}
        />
      )}
    </div>
  );
}
