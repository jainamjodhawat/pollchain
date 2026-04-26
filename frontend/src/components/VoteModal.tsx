import { useState } from "react";
import { CheckCircle, XCircle, MinusCircle, X } from "lucide-react";
import type { Proposal } from "../hooks/useProposals";
import { formatPoll } from "../utils/stellar";

interface Props {
  proposal: Proposal;
  onClose: () => void;
  onVote: (choice: "Yes" | "No" | "Abstain") => Promise<void>;
  votingPower: number;
}

export default function VoteModal({
  proposal,
  onClose,
  onVote,
  votingPower,
}: Props) {
  const [selected, setSelected] = useState<"Yes" | "No" | "Abstain" | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVote = async () => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      await onVote(selected);
      setSuccess(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Transaction failed";
      if (msg.includes("UnreachableCodeReached") || msg.includes("no voting power") || msg.includes("insufficient")) {
        setError("You need POLL tokens to vote. Visit the Faucet page to claim free tokens.");
      } else if (msg.includes("already voted")) {
        setError("You have already voted on this proposal.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="card"
        style={{ width: "100%", maxWidth: 480, padding: 28 }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 20,
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--color-text-muted)",
                marginBottom: 4,
              }}
            >
              Proposal #{proposal.id}
            </div>
            <h3 style={{ fontSize: "1.0625rem" }}>{proposal.title}</h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-text-muted)",
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <CheckCircle
              size={48}
              color="var(--color-passed)"
              style={{ margin: "0 auto 12px" }}
            />
            <h4 style={{ marginBottom: 8 }}>Vote Cast Successfully!</h4>
            <p style={{ fontSize: "0.875rem", marginBottom: 20 }}>
              Your vote of <strong>{selected}</strong> has been recorded
              on-chain.
            </p>
            <button className="btn btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Voting power */}
            <div
              style={{
                background: "var(--color-accent-lighter)",
                borderRadius: "var(--radius-md)",
                padding: "10px 14px",
                marginBottom: 20,
                fontSize: "0.875rem",
                color: "var(--color-accent)",
                fontWeight: 600,
              }}
            >
              Your voting power: {formatPoll(votingPower)} POLL
            </div>

            {/* Vote options */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  marginBottom: 10,
                }}
              >
                Cast your vote
              </div>
              <div className="vote-options">
                <button
                  className={`vote-option ${
                    selected === "Yes" ? "selected-yes" : ""
                  }`}
                  onClick={() => setSelected("Yes")}
                >
                  <CheckCircle
                    size={16}
                    style={{ margin: "0 auto 4px", display: "block" }}
                  />
                  Yes
                </button>
                <button
                  className={`vote-option ${
                    selected === "No" ? "selected-no" : ""
                  }`}
                  onClick={() => setSelected("No")}
                >
                  <XCircle
                    size={16}
                    style={{ margin: "0 auto 4px", display: "block" }}
                  />
                  No
                </button>
                <button
                  className={`vote-option ${
                    selected === "Abstain" ? "selected-abstain" : ""
                  }`}
                  onClick={() => setSelected("Abstain")}
                >
                  <MinusCircle
                    size={16}
                    style={{ margin: "0 auto 4px", display: "block" }}
                  />
                  Abstain
                </button>
              </div>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: 16 }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="btn btn-secondary"
                onClick={onClose}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleVote}
                disabled={!selected || loading}
                style={{ flex: 2 }}
              >
                {loading ? (
                  <>
                    <span className="spinner" style={{ width: 16, height: 16 }} />
                    Submitting...
                  </>
                ) : (
                  "Submit Vote"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
