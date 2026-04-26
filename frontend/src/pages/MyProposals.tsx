import { Link } from "react-router-dom";
import { Plus, FileText } from "lucide-react";
import { useWallet } from "../hooks/useWallet";
import { useProposals } from "../hooks/useProposals";
import ProposalCard from "../components/ProposalCard";

export default function MyProposals() {
  const { wallet, connect } = useWallet();
  const { proposals, loading } = useProposals();

  const mine = proposals.filter(
    (p) => wallet.publicKey && p.proposer === wallet.publicKey
  );

  if (!wallet.connected) {
    return (
      <div className="page-wrapper">
        <div className="container">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">Connect your wallet</div>
            <div className="empty-state-desc">
              Connect Freighter to see your proposals.
            </div>
            <button className="btn btn-primary" onClick={connect}>
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="container">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 32,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h1 style={{ marginBottom: 4 }}>My Proposals</h1>
            <p>Proposals you've submitted on-chain.</p>
          </div>
          <Link to="/create" className="btn btn-primary">
            <Plus size={16} />
            New Proposal
          </Link>
        </div>

        {/* Stats */}
        <div className="stats-row" style={{ marginBottom: 28 }}>
          {(
            [
              ["Total", mine.length],
              ["Active", mine.filter((p) => p.status === "Active").length],
              ["Executed", mine.filter((p) => p.status === "Executed").length],
              ["Failed", mine.filter((p) => p.status === "Failed").length],
            ] as [string, number][]
          ).map(([label, count]) => (
            <div key={label} className="stat-item">
              <div className="stat-value">{count}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 80 }}>
            <div className="spinner" style={{ margin: "0 auto 16px" }} />
            <p>Loading your proposals from chain...</p>
          </div>
        ) : mine.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileText size={40} color="var(--color-text-muted)" />
            </div>
            <div className="empty-state-title">No proposals yet</div>
            <div className="empty-state-desc">
              You haven't created any proposals. Be the first to propose
              something to the community.
            </div>
            <Link to="/create" className="btn btn-primary">
              Create Your First Proposal
            </Link>
          </div>
        ) : (
          <div className="proposals-grid">
            {mine.map((p) => (
              <ProposalCard key={p.id} proposal={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
