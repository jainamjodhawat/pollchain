import { Link } from "react-router-dom";
import { Clock, User, TrendingUp } from "lucide-react";
import type { Proposal } from "../hooks/useProposals";
import {
  formatPoll,
  shortenAddress,
  statusColor,
  statusLabel,
  votePercentage,
} from "../utils/stellar";

interface Props {
  proposal: Proposal;
}

export default function ProposalCard({ proposal }: Props) {
  const pct = votePercentage(
    proposal.yes_votes,
    proposal.no_votes,
    proposal.abstain_votes
  );
  const totalVotes =
    proposal.yes_votes + proposal.no_votes + proposal.abstain_votes;

  return (
    <Link
      to={`/proposals/${proposal.id}`}
      style={{ textDecoration: "none", display: "block" }}
    >
      <div className="card card-clickable proposal-card">
        {/* Header */}
        <div className="proposal-card-header">
          <div style={{ flex: 1 }}>
            <div className="proposal-id">Proposal #{proposal.id}</div>
            <div className="proposal-title">{proposal.title}</div>
          </div>
          <span className={`badge ${statusColor(proposal.status)}`}>
            {proposal.status === "Active" && (
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "currentColor",
                  display: "inline-block",
                }}
              />
            )}
            {statusLabel(proposal.status)}
          </span>
        </div>

        {/* Description */}
        <p className="proposal-description">{proposal.description}</p>

        {/* Vote bar */}
        {totalVotes > 0 && (
          <div>
            <div className="vote-bar-container">
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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 6,
                fontSize: "0.75rem",
                color: "var(--color-text-muted)",
              }}
            >
              <span style={{ color: "var(--color-passed)", fontWeight: 600 }}>
                ✓ {pct.yes}% Yes
              </span>
              <span style={{ color: "var(--color-failed)", fontWeight: 600 }}>
                ✗ {pct.no}% No
              </span>
              <span>{pct.abstain}% Abstain</span>
            </div>
          </div>
        )}

        {/* Meta */}
        <div className="proposal-meta">
          <span className="proposal-meta-item">
            <User size={12} />
            {shortenAddress(proposal.proposer)}
          </span>
          <span className="proposal-meta-item">
            <TrendingUp size={12} />
            {formatPoll(totalVotes)} POLL voted
          </span>
          <span className="proposal-meta-item">
            <Clock size={12} />
            Ends ledger #{proposal.end_ledger}
          </span>
        </div>

        {/* Tags */}
        {proposal.tags && proposal.tags.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {proposal.tags.map((tag) => (
              <span key={tag} style={{ padding: "2px 10px", borderRadius: "var(--radius-full)", fontSize: "0.75rem", fontWeight: 600, background: "var(--color-accent-lighter)", color: "var(--color-accent)" }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
