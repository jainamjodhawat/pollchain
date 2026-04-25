import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Info, CheckCircle, ExternalLink } from "lucide-react";
import { useWallet } from "../hooks/useWallet";
import { usePollBalance } from "../hooks/usePollBalance";
import { createProposal } from "../utils/contracts";
import { formatPoll } from "../utils/stellar";

type TemplateKey = "budget" | "param" | "grant" | "custom";

const TAGS = ["DeFi", "Community", "Technical", "Treasury", "Other"];

interface TemplateFields {
  budget: { recipient: string; amount: string; reason: string };
  param: { parameter: string; oldValue: string; newValue: string };
  grant: { grantee: string; amount: string; milestone: string };
  custom: { calldata: string };
}

function buildCalldata(template: TemplateKey, fields: TemplateFields, tags: string[]): string {
  let base: Record<string, unknown> = {};
  if (template === "budget") {
    base = { action: "transfer", to: fields.budget.recipient, amount: parseFloat(fields.budget.amount) || 0, reason: fields.budget.reason };
  } else if (template === "param") {
    base = { action: "update_config", parameter: fields.param.parameter, old_value: fields.param.oldValue, new_value: fields.param.newValue };
  } else if (template === "grant") {
    base = { action: "grant", grantee: fields.grant.grantee, amount: parseFloat(fields.grant.amount) || 0, milestone: fields.grant.milestone };
  } else {
    try { base = JSON.parse(fields.custom.calldata); } catch { base = { raw: fields.custom.calldata }; }
  }
  if (tags.length > 0) base.tags = tags;
  return JSON.stringify(base, null, 2);
}

export default function CreateProposal() {
  const navigate = useNavigate();
  const { wallet, connect } = useWallet();
  const { balance } = usePollBalance(wallet.publicKey);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [template, setTemplate] = useState<TemplateKey>("budget");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [fields, setFields] = useState<TemplateFields>({
    budget: { recipient: "", amount: "", reason: "" },
    param: { parameter: "", oldValue: "", newValue: "" },
    grant: { grantee: "", amount: "", milestone: "" },
    custom: { calldata: JSON.stringify({ action: "custom", params: {} }, null, 2) },
  });

  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateField = (t: TemplateKey, key: string, val: string) => {
    setFields((prev) => ({ ...prev, [t]: { ...prev[t], [key]: val } }));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.connected || !wallet.publicKey) { await connect(); return; }
    setSubmitting(true); setError(null);
    try {
      const calldata = buildCalldata(template, fields, selectedTags);
      JSON.parse(calldata); // validate
      const hash = await createProposal(wallet.publicKey, title, description, calldata);
      setTxHash(hash);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
    } finally { setSubmitting(false); }
  };

  if (txHash) {
    return (
      <div className="page-wrapper">
        <div className="container">
          <div className="card" style={{ maxWidth: 520, margin: "80px auto", padding: 40, textAlign: "center" }}>
            <CheckCircle size={56} color="var(--color-passed)" style={{ margin: "0 auto 16px" }} />
            <h2 style={{ marginBottom: 12 }}>Proposal Submitted On-Chain!</h2>
            <p style={{ marginBottom: 8 }}>
              "<strong>{title}</strong>" is now live for community voting.
            </p>
            <a href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.8125rem", color: "var(--color-accent)", marginBottom: 28 }}>
              View transaction <ExternalLink size={12} />
            </a>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button className="btn btn-primary" onClick={() => navigate("/proposals")}>View Proposals</button>
              <button className="btn btn-secondary" onClick={() => { setTxHash(null); setTitle(""); setDescription(""); }}>Create Another</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="container">
        <Link to="/proposals" className="btn btn-ghost btn-sm" style={{ marginBottom: 24, display: "inline-flex" }}>
          <ArrowLeft size={14} /> Back to Proposals
        </Link>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24, alignItems: "start" }}>
          <div className="card" style={{ padding: 32 }}>
            <h2 style={{ marginBottom: 8 }}>Create Proposal</h2>
            <p style={{ marginBottom: 28 }}>Submit a governance proposal on-chain.</p>

            {wallet.connected && (
              <div style={{ background: "var(--color-accent-lighter)", borderRadius: "var(--radius-md)", padding: "10px 14px", marginBottom: 24, fontSize: "0.875rem", color: "var(--color-accent)", fontWeight: 600, display: "flex", justifyContent: "space-between" }}>
                <span>Your POLL balance</span>
                <span>{formatPoll(balance)} POLL</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Title */}
              <div className="form-group">
                <label className="form-label">Proposal Title *</label>
                <input className="form-input" placeholder="e.g. Allocate 5,000 POLL to Community Fund" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
                <span className="form-hint">{title.length}/120</span>
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea className="form-textarea" placeholder="Describe what this proposal does and why it matters..." value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} style={{ minHeight: 120 }} />
              </div>

              {/* Tags */}
              <div className="form-group">
                <label className="form-label">Tags</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {TAGS.map((tag) => (
                    <button key={tag} type="button"
                      onClick={() => toggleTag(tag)}
                      style={{
                        padding: "4px 12px", borderRadius: "var(--radius-full)", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", border: "1.5px solid",
                        borderColor: selectedTags.includes(tag) ? "var(--color-accent)" : "var(--color-border)",
                        background: selectedTags.includes(tag) ? "var(--color-accent-lighter)" : "transparent",
                        color: selectedTags.includes(tag) ? "var(--color-accent)" : "var(--color-text-muted)",
                      }}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template selector */}
              <div className="form-group">
                <label className="form-label">Proposal Type</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {([["budget", "Budget Request"], ["param", "Parameter Change"], ["grant", "Community Grant"], ["custom", "Custom"]] as [TemplateKey, string][]).map(([key, label]) => (
                    <button key={key} type="button" className={`btn btn-sm ${template === key ? "btn-primary" : "btn-ghost"}`} onClick={() => setTemplate(key)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template fields */}
              {template === "budget" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16, background: "var(--color-bg)", borderRadius: "var(--radius-md)" }}>
                  <div className="form-group">
                    <label className="form-label">Recipient Address</label>
                    <input className="form-input" placeholder="G..." value={fields.budget.recipient} onChange={(e) => updateField("budget", "recipient", e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Amount (POLL)</label>
                    <input className="form-input" type="number" placeholder="1000" value={fields.budget.amount} onChange={(e) => updateField("budget", "amount", e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reason</label>
                    <input className="form-input" placeholder="Why should this be funded?" value={fields.budget.reason} onChange={(e) => updateField("budget", "reason", e.target.value)} />
                  </div>
                </div>
              )}

              {template === "param" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16, background: "var(--color-bg)", borderRadius: "var(--radius-md)" }}>
                  <div className="form-group">
                    <label className="form-label">Parameter Name</label>
                    <input className="form-input" placeholder="e.g. proposal_threshold" value={fields.param.parameter} onChange={(e) => updateField("param", "parameter", e.target.value)} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div className="form-group">
                      <label className="form-label">Old Value</label>
                      <input className="form-input" placeholder="100" value={fields.param.oldValue} onChange={(e) => updateField("param", "oldValue", e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">New Value</label>
                      <input className="form-input" placeholder="50" value={fields.param.newValue} onChange={(e) => updateField("param", "newValue", e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {template === "grant" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16, background: "var(--color-bg)", borderRadius: "var(--radius-md)" }}>
                  <div className="form-group">
                    <label className="form-label">Grantee Address</label>
                    <input className="form-input" placeholder="G..." value={fields.grant.grantee} onChange={(e) => updateField("grant", "grantee", e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Grant Amount (POLL)</label>
                    <input className="form-input" type="number" placeholder="500" value={fields.grant.amount} onChange={(e) => updateField("grant", "amount", e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Milestone / Deliverable</label>
                    <input className="form-input" placeholder="What will be delivered?" value={fields.grant.milestone} onChange={(e) => updateField("grant", "milestone", e.target.value)} />
                  </div>
                </div>
              )}

              {template === "custom" && (
                <div className="form-group">
                  <label className="form-label">Calldata JSON</label>
                  <textarea className="form-textarea" value={fields.custom.calldata} onChange={(e) => updateField("custom", "calldata", e.target.value)} rows={6} style={{ fontFamily: "monospace", fontSize: "0.8125rem", minHeight: 140 }} />
                </div>
              )}

              {/* Preview */}
              <details style={{ fontSize: "0.8125rem" }}>
                <summary style={{ cursor: "pointer", color: "var(--color-text-muted)", marginBottom: 8 }}>Preview calldata</summary>
                <pre style={{ background: "#0f0f0f", color: "#e5e7eb", padding: 12, borderRadius: "var(--radius-md)", overflowX: "auto", fontSize: "0.75rem" }}>
                  {buildCalldata(template, fields, selectedTags)}
                </pre>
              </details>

              {error && <div className="alert alert-error"><Info size={16} /> {error}</div>}

              <button type="submit" className="btn btn-primary btn-lg" disabled={submitting || !title || !description}>
                {submitting ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Submitting on-chain...</> : !wallet.connected ? "Connect Wallet to Submit" : "Submit Proposal On-Chain"}
              </button>
            </form>
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card" style={{ padding: 20 }}>
              <h4 style={{ marginBottom: 12 }}>Requirements</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: "0.875rem" }}>
                {[["Min. POLL balance", "100 POLL"], ["Voting period", "~1 day"], ["Quorum", "10 POLL min"], ["Pass condition", "Yes > No"], ["Network fee", "~$0.0007"]].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>{l}</span>
                    <span style={{ fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card" style={{ padding: 20 }}>
              <h4 style={{ marginBottom: 10 }}>💡 Tips</h4>
              <ul style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", paddingLeft: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                <li>Use tags to help voters find your proposal</li>
                <li>Be specific about deliverables</li>
                <li>Discuss in community before submitting</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
