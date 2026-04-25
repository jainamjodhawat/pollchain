import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useWallet } from "../hooks/useWallet";
import { shortenAddress } from "../utils/stellar";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/proposals", label: "Proposals" },
  { to: "/create", label: "Create" },
  { to: "/faucet", label: "Faucet" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/delegate", label: "Delegate" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/treasury", label: "Treasury" },
  { to: "/about", label: "About" },
];

export default function Navbar() {
  const location = useLocation();
  const { wallet, loading, connect } = useWallet();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) =>
    location.pathname === path ? "navbar-link active" : "navbar-link";

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo">
          <div className="navbar-logo-icon">P</div>
          PollChain
        </Link>

        {/* Desktop links */}
        <div className="navbar-links">
          {NAV_LINKS.map((l) => (
            <Link key={l.to} to={l.to} className={isActive(l.to)}>
              {l.label}
            </Link>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {loading ? (
            <div className="spinner" />
          ) : wallet.connected && wallet.publicKey ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--color-accent-lighter)", padding: "6px 14px", borderRadius: "var(--radius-full)", fontSize: "0.875rem", fontWeight: 600, color: "var(--color-accent)" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-passed)", display: "inline-block" }} />
              {shortenAddress(wallet.publicKey)}
            </div>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={connect}>
              Connect Wallet
            </button>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ background: "none", border: "none", cursor: "pointer", display: "none", padding: 4 }}
            className="mobile-menu-btn"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div style={{ background: "var(--color-bg-secondary)", borderTop: "1px solid var(--color-border)", padding: "12px 24px", display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={isActive(l.to)}
              onClick={() => setMobileOpen(false)}
              style={{ padding: "8px 12px" }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
