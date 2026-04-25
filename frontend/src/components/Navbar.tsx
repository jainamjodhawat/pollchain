import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Droplets, LayoutDashboard, Users, Trophy, Landmark, Vote, Plus, Info, Home } from "lucide-react";
import { useWallet } from "../hooks/useWallet";
import { shortenAddress } from "../utils/stellar";

const NAV_LINKS = [
  { to: "/", label: "Home", icon: <Home size={16} /> },
  { to: "/proposals", label: "Proposals", icon: <Vote size={16} /> },
  { to: "/create", label: "Create", icon: <Plus size={16} /> },
  { to: "/faucet", label: "Faucet", icon: <Droplets size={16} /> },
  { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
  { to: "/delegate", label: "Delegate", icon: <Users size={16} /> },
  { to: "/leaderboard", label: "Leaderboard", icon: <Trophy size={16} /> },
  { to: "/treasury", label: "Treasury", icon: <Landmark size={16} /> },
  { to: "/about", label: "About", icon: <Info size={16} /> },
];

export default function Navbar() {
  const location = useLocation();
  const { wallet, loading, connect } = useWallet();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close menu on outside click
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: MouseEvent) => {
      const nav = document.getElementById("pollchain-nav");
      if (nav && !nav.contains(e.target as Node)) setMobileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobileOpen]);

  const isActive = (path: string) =>
    location.pathname === path ? "navbar-link active" : "navbar-link";

  return (
    <nav className="navbar" id="pollchain-nav">
      <div className="container navbar-inner">
        {/* Logo */}
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

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Wallet — hidden on very small screens, shown in mobile menu */}
          <div className="wallet-btn-desktop">
            {loading ? (
              <div className="spinner" />
            ) : wallet.connected && wallet.publicKey ? (
              <div className="wallet-badge">
                <span className="wallet-dot" />
                {shortenAddress(wallet.publicKey)}
              </div>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={connect}>
                Connect Wallet
              </button>
            )}
          </div>

          {/* Hamburger — only visible on mobile */}
          <button
            className="hamburger-btn"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div className={`mobile-drawer ${mobileOpen ? "mobile-drawer-open" : ""}`}>
        {/* Wallet in mobile */}
        <div className="mobile-wallet">
          {loading ? (
            <div className="spinner" />
          ) : wallet.connected && wallet.publicKey ? (
            <div className="wallet-badge" style={{ justifyContent: "center" }}>
              <span className="wallet-dot" />
              {wallet.publicKey.slice(0, 8)}...{wallet.publicKey.slice(-6)}
            </div>
          ) : (
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => { connect(); setMobileOpen(false); }}>
              Connect Wallet
            </button>
          )}
        </div>

        <div className="mobile-divider" />

        {/* Nav links */}
        <div className="mobile-nav-links">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`mobile-nav-link ${location.pathname === l.to ? "mobile-nav-link-active" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              <span className="mobile-nav-icon">{l.icon}</span>
              {l.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Backdrop */}
      {mobileOpen && (
        <div className="mobile-backdrop" onClick={() => setMobileOpen(false)} />
      )}
    </nav>
  );
}
