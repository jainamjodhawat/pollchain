import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Info, CheckCircle } from "lucide-react";
import { useWallet } from "../hooks/useWallet";

interface FormData {
  title: string;
  description: string;
  calldata: string;
}

const CALLDATA_TEMPLATES = [
  {
    label: "Treasury Transfer",
    value: JSON.stringify(
      { action: "transfer", to: "GXXXXXXX", amount: 1000 },
      null,
      2
    ),
  },
  {
    label: "Update Config",
    value: JSON.stringify(
      { action: "update_config", proposal_threshold: 50, voting_period: 17280 },
      null,
      2
    ),
  },
  {
    label: "Custom Action",
    value: JSON.stringify({ action: "custom", params: {} }, null, 2),
  },
];

export default function CreateProposal() {
  const { wallet, connect } = useWallet();
  const [form, setForm] = useState<FormData>({
    title: "",
    description: "",
    calldata: CALLDATA_TEMPLATES[0].value,
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.connected) {
      await connect();
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      JSON.parse(form.calldata);
      await new Promise((r) => setTimeout(r, 2000));
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      setError(
        msg.includes("JSON")
          ? "Invalid calldata JSON. Please check the format."
          : msg
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="page-wrapper">
        <div className="container">
          <div
            className="card"
            style={{
              maxWidth: 520,
              margin: "80px auto",
              padding: 40,
              textAlign: "center",
            }}
          >
            <CheckCircle
              size={56}
              color="var(--color-passed)"
              style={{ margin: "0 auto 16px" }}
            />
            <h2 style={{ marginBottom: 12 }}>Proposal Created!</h2>
            <p style={{ marginBottom: 28 }}>
              Your proposal "<strong>{form.title}</strong>" has been submitted
              on-chain. The community can now vote on it.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <Link to="/proposals" className="btn btn-primary">
                View Proposals
              </Link>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSuccess(false);
                  setForm({
                    title: "",
                    description: "",
                    calldata: CALLDATA_TEMPLATES[0].value,
                  });
                }}
              >
                Create Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="container">
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
            gridTemplateColumns: "1fr 300px",
            gap: 24,
            alignItems: "start",
          }}
        >
          {/* Form */}
          <div className="card" style={{ padding: 32 }}>
            <h2 style={{ marginBottom: 8 }}>Create Proposal</h2>
            <p style={{ marginBottom: 28 }}>
              Submit a governance proposal for the PollChain community to vote on.
            </p>

            {!wallet.connected && (
              <div className="alert alert-info" style={{ marginBottom: 24 }}>
                <Info size={16} />
                Connect your wallet to create a proposal. You need at least 100
                POLL tokens.
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: 20 }}
            >
              <div className="form-group">
                <label className="form-label" htmlFor="title">
                  Proposal Title *
                </label>
                <input
                  id="title"
                  name="title"
                  className="form-input"
                  placeholder="e.g. Allocate 5,000 POLL to Community Fund"
                  value={form.title}
                  onChange={handleChange}
                  required
                  maxLength={120}
                />
                <span className="form-hint">
                  {form.title.length}/120 characters
                </span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="description">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  className="form-textarea"
                  placeholder="Describe what this proposal does, why it matters, and how it benefits the community..."
                  value={form.description}
                  onChange={handleChange}
                  required
                  rows={5}
                  style={{ minHeight: 140 }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="calldata">
                  Execution Calldata (JSON) *
                </label>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 8,
                    flexWrap: "wrap",
                  }}
                >
                  {CALLDATA_TEMPLATES.map((t) => (
                    <button
                      key={t.label}
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() =>
                        setForm((prev) => ({ ...prev, calldata: t.value }))
                      }
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <textarea
                  id="calldata"
                  name="calldata"
                  className="form-textarea"
                  value={form.calldata}
                  onChange={handleChange}
                  required
                  rows={6}
                  style={{
                    fontFamily: "monospace",
                    fontSize: "0.8125rem",
                    minHeight: 140,
                  }}
                />
                <span className="form-hint">
                  JSON data passed to the Execution contract when this proposal
                  passes.
                </span>
              </div>

              {error && (
                <div className="alert alert-error">
                  <Info size={16} />
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={submitting || !form.title || !form.description}
              >
                {submitting ? (
                  <>
                    <span
                      className="spinner"
                      style={{ width: 18, height: 18 }}
                    />
                    Submitting...
                  </>
                ) : !wallet.connected ? (
                  "Connect Wallet to Submit"
                ) : (
                  "Submit Proposal"
                )}
              </button>
            </form>
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card" style={{ padding: 20 }}>
              <h4 style={{ marginBottom: 12 }}>Requirements</h4>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  fontSize: "0.875rem",
                }}
              >
                {[
                  { label: "Min. POLL balance", value: "100 POLL" },
                  { label: "Voting period", value: "~1 day (17,280 ledgers)" },
                  { label: "Quorum required", value: "10 POLL minimum" },
                  { label: "Pass condition", value: "Yes > No votes" },
                  { label: "Network fee", value: "~$0.0007" },
                ].map((r) => (
                  <div
                    key={r.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <span style={{ color: "var(--color-text-muted)" }}>
                      {r.label}
                    </span>
                    <span style={{ fontWeight: 600 }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <h4 style={{ marginBottom: 10 }}>💡 Tips</h4>
              <ul
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--color-text-secondary)",
                  paddingLeft: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <li>Be specific about what the proposal will do</li>
                <li>Include expected outcomes and benefits</li>
                <li>Discuss in the community before submitting</li>
                <li>Ensure calldata is valid JSON</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
