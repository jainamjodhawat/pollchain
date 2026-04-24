import { Zap, Code } from "lucide-react";

export default function About() {
  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: 800 }}>
        {/* Header */}
        <div style={{ marginBottom: 48, textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "var(--color-accent-lighter)",
              color: "var(--color-accent)",
              padding: "4px 14px",
              borderRadius: "var(--radius-full)",
              fontSize: "0.8125rem",
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            <Zap size={12} />
            Built on Stellar & Soroban
          </div>
          <h1 style={{ marginBottom: 16 }}>About PollChain</h1>
          <p style={{ fontSize: "1.0625rem", maxWidth: 560, margin: "0 auto" }}>
            A lightweight, gasless DAO governance platform built on Stellar's
            Soroban smart contract platform.
          </p>
        </div>

        {/* What is it */}
        <div className="card" style={{ padding: 32, marginBottom: 20 }}>
          <h2 style={{ marginBottom: 16 }}>What is PollChain?</h2>
          <p style={{ marginBottom: 16, lineHeight: 1.8 }}>
            PollChain is a decentralized governance tool that lets any community
            — Discord servers, student organizations, startup teams, or DAOs —
            create proposals, vote with governance tokens, and automatically
            execute decisions on-chain.
          </p>
          <p style={{ lineHeight: 1.8 }}>
            Unlike Ethereum-based governance tools where a single vote can cost
            $5–$50 in gas fees, PollChain runs on Stellar where transactions
            cost approximately <strong>$0.0007</strong>. This makes governance
            genuinely accessible to small communities and emerging markets.
          </p>
        </div>

        {/* Architecture */}
        <div className="card" style={{ padding: 32, marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 20,
            }}
          >
            <Code size={20} color="var(--color-accent)" />
            <h2>Smart Contract Architecture</h2>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            {[
              {
                name: "Governance Token (POLL)",
                desc: "SEP-41 compliant fungible token. Voting power is proportional to POLL balance. Supports minting, burning, transfers, and allowances.",
                color: "#7c3aed",
              },
              {
                name: "Voting Contract",
                desc: "Core governance logic. Handles proposal creation, vote casting, quorum checks, and finalization. Makes an inter-contract call to the Execution contract when a proposal passes.",
                color: "#2563eb",
              },
              {
                name: "Execution Contract",
                desc: "Called by the Voting contract via inter-contract call when a proposal passes. Records execution logs on-chain and emits events. Extensible to perform treasury transfers, parameter updates, and more.",
                color: "#059669",
              },
            ].map((c) => (
              <div
                key={c.name}
                style={{
                  display: "flex",
                  gap: 16,
                  padding: 16,
                  background: "var(--color-bg)",
                  borderRadius: "var(--radius-md)",
                  borderLeft: `3px solid ${c.color}`,
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      marginBottom: 4,
                      color: c.color,
                    }}
                  >
                    {c.name}
                  </div>
                  <p style={{ fontSize: "0.875rem", margin: 0 }}>{c.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 20,
              padding: 16,
              background: "var(--color-accent-lighter)",
              borderRadius: "var(--radius-md)",
              fontSize: "0.875rem",
              color: "var(--color-accent)",
            }}
          >
            <strong>Inter-contract call flow:</strong> When a proposal passes,
            the Voting contract calls{" "}
            <code
              style={{
                background: "rgba(124,58,237,0.1)",
                padding: "1px 6px",
                borderRadius: 4,
              }}
            >
              execution.execute()
            </code>{" "}
            directly on-chain — no off-chain relayer needed.
          </div>
        </div>

        {/* Tech stack */}
        <div className="card" style={{ padding: 32, marginBottom: 20 }}>
          <h2 style={{ marginBottom: 20 }}>Tech Stack</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
            }}
          >
            {[
              { label: "Smart Contracts", value: "Rust + Soroban SDK v22" },
              { label: "Blockchain", value: "Stellar (Testnet)" },
              { label: "Frontend", value: "React + TypeScript + Vite" },
              { label: "Wallet", value: "Freighter (SEP-7)" },
              { label: "Styling", value: "Custom CSS (no framework)" },
              { label: "CI/CD", value: "GitHub Actions" },
              { label: "Hosting", value: "Vercel" },
              { label: "Token Standard", value: "SEP-41" },
            ].map((t) => (
              <div
                key={t.label}
                style={{
                  padding: "12px 14px",
                  background: "var(--color-bg)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-text-muted)",
                    marginBottom: 2,
                  }}
                >
                  {t.label}
                </div>
                <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                  {t.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Links */}
        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ marginBottom: 20 }}>Links</h2>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a
              href="https://github.com/jainamjodhawat/pollchain"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              GitHub Repository ↗
            </a>
            <a
              href="https://stellar.org/soroban"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
            >
              Soroban Docs ↗
            </a>
            <a
              href="https://laboratory.stellar.org"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
            >
              Stellar Lab ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
