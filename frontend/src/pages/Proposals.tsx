import { useState } from "react";
import { Search } from "lucide-react";
import { useProposals } from "../hooks/useProposals";
import ProposalCard from "../components/ProposalCard";

type StatusFilter = "All" | "Active" | "Passed" | "Failed" | "Executed" | "Cancelled";
const ALL_TAGS = ["DeFi", "Community", "Technical", "Treasury", "Other"];

export default function Proposals() {
  const { proposals, loading, error } = useProposals();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const filtered = proposals.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || p.status === statusFilter;
    const matchesTag = !tagFilter || p.tags.includes(tagFilter);
    return matchesSearch && matchesStatus && matchesTag;
  });

  const statusOptions: StatusFilter[] = ["All", "Active", "Passed", "Failed", "Executed", "Cancelled"];

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ marginBottom: 8 }}>Proposals</h1>
          <p>Browse and vote on governance proposals for the PollChain DAO.</p>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 240px" }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
            <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Search proposals..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {statusOptions.map((s) => (
              <button key={s} className={`btn btn-sm ${statusFilter === s ? "btn-primary" : "btn-ghost"}`} onClick={() => setStatusFilter(s)}>{s}</button>
            ))}
          </div>
        </div>

        {/* Tag filter */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
          <button className={`btn btn-sm ${!tagFilter ? "btn-primary" : "btn-ghost"}`} onClick={() => setTagFilter(null)}>All Tags</button>
          {ALL_TAGS.map((tag) => (
            <button key={tag} className={`btn btn-sm ${tagFilter === tag ? "btn-primary" : "btn-ghost"}`} onClick={() => setTagFilter(tagFilter === tag ? null : tag)}>{tag}</button>
          ))}
        </div>

        {/* Results count */}
        <div
          style={{
            fontSize: "0.875rem",
            color: "var(--color-text-muted)",
            marginBottom: 16,
          }}
        >
          {loading ? "Loading..." : `${filtered.length} proposal${filtered.length !== 1 ? "s" : ""}`}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 80 }}>
            <div className="spinner" style={{ margin: "0 auto 16px" }} />
            <p>Loading proposals...</p>
          </div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-title">No proposals found</div>
            <div className="empty-state-desc">
              Try adjusting your search or filter.
            </div>
          </div>
        ) : (
          <div className="proposals-grid">
            {filtered.map((p) => (
              <ProposalCard key={p.id} proposal={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
