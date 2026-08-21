import { useState, useEffect } from "react";
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
  ExternalLink,
  RefreshCw,
  Sparkles,
  Gift,
} from "lucide-react";
import { useProposal } from "../hooks/useProposals";
import { useWallet } from "../hooks/useWallet";
import {
  castVote,
  fetchVote,
  finalizeProposal,
  fetchVotingConfig,
  fetchVotingPower,
} from "../utils/contracts";
import type { VotingConfig } from "../utils/contracts";
import VoteModal from "../components/VoteModal";
import TransactionReceipt from "../components/TransactionReceipt";
import {
  formatPoll,
  shortenAddress,
  statusColor,
  statusLabel,
  votePercentage,
} from "../utils/stellar";
import { VOTING_CONTRACT_ID } from "../utils/constants";

export default function ProposalDetail() {
  const { id } = useParams<{ id: string }>();
  const proposalId = Number(id);
  const { proposal, loading, error, refetch } = useProposal(proposalId);
  const { wallet, connect } = useWallet();

  const [showVoteModal, setShowVoteModal] = useState(false);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeHash, setFinalizeHash] = useState<string | null>(null);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  
  // Voting settings from contract config
  const [votingConfig, setVotingConfig] = useState<VotingConfig | null>(null);
  const [votingPower, setVotingPower] = useState<bigint>(0n);

  // Optimistic vote counts — updated instantly on vote, then confirmed by chain
  const [optimisticVotes, setOptimisticVotes] = useState<{
    yes: number;
    no: number;
    abstain: number;
  } | null>(null);

  // Load global voting contract configurations
  useEffect(() => {
    fetchVotingConfig().then(setVotingConfig).catch(console.error);
  }, []);

  // Fetch voting power for the connected wallet
  useEffect(() => {
    if (!wallet.publicKey) return;
    fetchVotingPower(wallet.publicKey).then(setVotingPower).catch(() => {});
  }, [wallet.publicKey]);

  // Check if user already voted
  useEffect(() => {
    if (!wallet.publicKey || !proposal) return;
    fetchVote(proposalId, wallet.publicKey).then((v) => {
      if (v) setUserVote(v.tag);
    });
  }, [wallet.publicKey, proposalId, proposal]);

  // Calculate quadratic voting weights (Babylonian isqrt)
  const calculateQVWeight = (rawPower: bigint) => {
    if (rawPower <= 0n) return 0n;
    let x0 = rawPower / 2n;
    if (x0 === 0n) x0 = 1n;
    let x1 = (x0 + rawPower / x0) / 2n;
    while (x1 < x0) {
      x0 = x1;
      x1 = (x0 + rawPower / x0) / 2n;
    }
    return x0;
  };

  const isQVActive = !!votingConfig?.quadratic_voting;
  const effectiveWeight = isQVActive ? calculateQVWeight(votingPower) : votingPower;
  const rewardAmount = votingConfig?.reward_amount ?? 0n;

  const handleVote = async (choice: "Yes" | "No" | "Abstain") => {
    if (!wallet.publicKey) throw new Error("Wallet not connected");

    // Update the visible result before confirmation, but do not mark the
    // wallet as voted until the transaction is actually confirmed.
    const weight = Number(effectiveWeight);
    const pendingVotes = {
      yes: (proposal!.yes_votes) + (choice === "Yes" ? weight : 0),
      no: (proposal!.no_votes) + (choice === "No" ? weight : 0),
      abstain: (proposal!.abstain_votes) + (choice === "Abstain" ? weight : 0),
    };
    setOptimisticVotes(pendingVotes);

    try {
      const hash = await castVote(wallet.publicKey, proposalId, choice);
      setTxHash(hash);
      setUserVote(choice);

      // Keep the instant result visible until an RPC read includes the vote.
      // Soroban RPC can lag one ledger after a successful transaction.
      void refetch().then((refreshed) => {
        if (
          refreshed &&
          refreshed.yes_votes >= pendingVotes.yes &&
          refreshed.no_votes >= pendingVotes.no &&
          refreshed.abstain_votes >= pendingVotes.abstain
        ) {
          setOptimisticVotes(null);
        }
      });
    } catch (e) {
      setOptimisticVotes(null);
      throw e;
    }
  };

  const handleFinalize = async () => {
    if (!wallet.publicKey) return;
    setFinalizing(true);
    setFinalizeError(null);
    try {
      const hash = await finalizeProposal(wallet.publicKey, proposalId);
      setFinalizeHash(hash);
      await refetch();
    } catch (e: unknown) {
      setFinalizeError(e instanceof Error ? e.message : "Finalize failed");
    } finally {
      setFinalizing(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="container" style={{ textAlign: "center", paddingTop: 80 }}>
          <div className="spinner" style={{ margin: "0 auto 16px" }} />
          <p>Loading proposal details from chain...</p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="page-wrapper">
        <div className="container">
          <div className="empty-state">
            <div className="empty-state-icon">❓</div>
            <div className="empty-state-title">Proposal not found</div>
            <div className="empty-state-desc">
              {error || "This proposal doesn't exist on-chain."}
            </div>
            <Link to="/proposals" className="btn btn-primary">
              Back to Proposals
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const displayYes = optimisticVotes?.yes ?? proposal.yes_votes;
  const displayNo = optimisticVotes?.no ?? proposal.no_votes;
  const displayAbstain = optimisticVotes?.abstain ?? proposal.abstain_votes;

  const pct = votePercentage(displayYes, displayNo, displayAbstain);
  const totalVotes = displayYes + displayNo + displayAbstain;
  const isActive = proposal.status === "Active";

  let calldataDisplay = proposal.calldata;
  try {
    calldataDisplay = JSON.stringify(JSON.parse(proposal.calldata), null, 2);
  } catch {
    // not JSON, show raw
  }

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
          {/* Main Content */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            
            {/* Proposal Details Card */}
            <div className="card" style={{ padding: 28, background: "white" }}>
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
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={refetch}
                    title="Refresh from chain"
                  >
                    <RefreshCw size={13} />
                  </button>
                  <span className={`badge ${statusColor(proposal.status)}`}>
                    {statusLabel(proposal.status)}
                  </span>
                </div>
              </div>
              <h2 style={{ marginBottom: 16 }}>{proposal.title}</h2>
              <p style={{ lineHeight: 1.7, marginBottom: 20 }}>
                {proposal.description}
              </p>
              
              {/* Configuration parameters badges */}
              <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                {isQVActive && (
                  <span className="badge status-active" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Sparkles size={12} /> Quadratic Voting
                  </span>
                )}
                {rewardAmount > 0n && (
                  <span className="badge status-passed" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Gift size={12} /> Reward: {formatPoll(rewardAmount)} POLL
                  </span>
                )}
              </div>

              <div className="divider" style={{ margin: "20px 0" }} />
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
                  {shortenAddress(proposal.proposer)}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Clock size={14} />
                  Ends ledger #{proposal.end_ledger}
                </span>
                <a
                  href={`https://stellar.expert/explorer/testnet/contract/${VOTING_CONTRACT_ID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    color: "var(--color-accent)",
                    fontSize: "0.8125rem",
                  }}
                >
                  View contract <ExternalLink size={11} />
                </a>
              </div>
            </div>

            {/* Tx confirmation */}
            {txHash && (
              <TransactionReceipt action="Vote submitted" hash={txHash} publicKey={wallet.publicKey} compact />
            )}

            {/* Vote results */}
            <div className="card" style={{ padding: 28, background: "white" }}>
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
                  <div
                    className="vote-bar-container"
                    style={{ height: 12, marginBottom: 16 }}
                  >
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
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 12,
                    }}
                  >
                    {[
                      {
                        label: "Yes",
                        votes: displayYes,
                        pct: pct.yes,
                        color: "var(--color-passed)",
                        bg: "#d1fae5",
                        icon: <CheckCircle size={16} />,
                      },
                      {
                        label: "No",
                        votes: displayNo,
                        pct: pct.no,
                        color: "var(--color-failed)",
                        bg: "#fee2e2",
                        icon: <XCircle size={16} />,
                      },
                      {
                        label: "Abstain",
                        votes: displayAbstain,
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
                          {v.icon} {v.label}
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
                          {formatPoll(v.votes)} votes
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
                    Total: {formatPoll(totalVotes)} weight voted
                  </div>
                </>
              )}
            </div>

            {/* Calldata */}
            <div className="card" style={{ padding: 28, background: "white" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Code size={18} color="var(--color-accent)" />
                  <h3 style={{ margin: 0 }}>Execution Calldata</h3>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    const rows = [
                      ["proposal_id", "title", "status", "yes_votes", "no_votes", "abstain_votes", "start_ledger", "end_ledger", "proposer"],
                      [proposal.id, `"${proposal.title}"`, proposal.status, formatPoll(proposal.yes_votes), formatPoll(proposal.no_votes), formatPoll(proposal.abstain_votes), proposal.start_ledger, proposal.end_ledger, proposal.proposer],
                    ];
                    const csv = rows.map((r) => r.join(",")).join("\n");
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `proposal-${proposal.id}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Export CSV
                </button>
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
                {calldataDisplay}
              </pre>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Vote Action Card */}
            <div className="card" style={{ padding: 24, background: "white" }}>
              <h4 style={{ marginBottom: 16 }}>Cast Your Vote</h4>

              {userVote ? (
                <div className="alert alert-success">
                  <CheckCircle size={16} />
                  You voted <strong>{userVote}</strong> on-chain
                </div>
              ) : !isActive ? (
                <div className="alert alert-info">
                  <AlertCircle size={16} />
                  Voting period has ended.
                </div>
              ) : !wallet.connected ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", margin: 0 }}>
                    Connect Freighter wallet to vote.
                  </p>
                  <button className="btn btn-primary" onClick={connect}>
                    Connect Wallet
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  
                  {/* Voting Power info */}
                  <div
                    style={{
                      fontSize: "0.8125rem",
                      color: "var(--color-text-secondary)",
                      background: "var(--color-cream-dark)",
                      padding: 12,
                      borderRadius: "var(--radius-md)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Base Voting Power:</span>
                      <strong>{formatPoll(votingPower)} POLL</strong>
                    </div>
                    {isQVActive && (
                      <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed rgba(92,107,46,0.15)", paddingTop: 4, marginTop: 2 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <Sparkles size={11} color="var(--color-accent)" /> Effective weight:
                        </span>
                        <strong>{formatPoll(effectiveWeight)} votes</strong>
                      </div>
                    )}
                  </div>

                  <button
                    className="btn btn-primary"
                    onClick={() => setShowVoteModal(true)}
                    disabled={votingPower === 0n}
                  >
                    Vote Now
                  </button>
                  {votingPower === 0n && (
                    <p style={{ fontSize: "0.75rem", color: "var(--color-failed)", margin: 0 }}>
                      You need POLL tokens or delegated backing to vote.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Finalize Card */}
            {isActive && wallet.connected && (
              <div className="card" style={{ padding: 24, background: "white" }}>
                <h4 style={{ marginBottom: 8 }}>Finalize Proposal</h4>
                <p
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--color-text-muted)",
                    marginBottom: 12,
                  }}
                >
                  After the voting period ends (ledger #{proposal.end_ledger}), anyone can finalize this proposal to execute payments from the Treasury.
                </p>
                {finalizeHash && (
                  <div className="alert alert-success" style={{ marginBottom: 12 }}>
                    <CheckCircle size={14} />
                    Finalized!{" "}
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${finalizeHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "inherit", fontWeight: 700 }}
                    >
                      View tx ↗
                    </a>
                  </div>
                )}
                {finalizeError && (
                  <div className="alert alert-error" style={{ marginBottom: 12 }}>
                    {finalizeError}
                  </div>
                )}
                <button
                  className="btn btn-secondary"
                  onClick={handleFinalize}
                  disabled={finalizing}
                  style={{ width: "100%" }}
                >
                  {finalizing ? (
                    <>
                      <span className="spinner" style={{ width: 14, height: 14 }} />
                      Finalizing...
                    </>
                  ) : (
                    "Finalize Proposal"
                  )}
                </button>
              </div>
            )}

            {/* Proposal Info Card */}
            <div className="card" style={{ padding: 24, background: "white" }}>
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
                  { label: "ID", value: `#${proposal.id}` },
                  {
                    label: "Proposer",
                    value: shortenAddress(proposal.proposer),
                  },
                  {
                    label: "Start Ledger",
                    value: `#${proposal.start_ledger}`,
                  },
                  { label: "End Ledger", value: `#${proposal.end_ledger}` },
                  {
                    label: "Total Votes Voted",
                    value: `${formatPoll(totalVotes)} weight`,
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
              <div className="divider" style={{ margin: "16px 0" }} />
              <a
                href={`https://stellar.expert/explorer/testnet/contract/${VOTING_CONTRACT_ID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm"
                style={{ width: "100%", justifyContent: "center", background: "transparent" }}
              >
                View on Stellar Expert <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {showVoteModal && (
        <VoteModal
          proposal={proposal}
          onClose={() => setShowVoteModal(false)}
          onVote={handleVote}
          votingPower={votingPower}
          effectiveWeight={effectiveWeight}
          quadraticVotingActive={isQVActive}
          rewardAmount={rewardAmount}
        />
      )}
    </div>
  );
}
