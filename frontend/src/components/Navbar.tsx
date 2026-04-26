import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Droplets, LayoutDashboard, Users, Trophy, Landmark, Vote, Plus, Info, Home, LogOut, Copy, ExternalLink, ChevronDown, FileText } from "lucide-react";
import { useWallet } from "../hooks/useWallet";
import { shortenAddress } from "../utils/stellar";

const NAV_LINKS = [
  { to: "/", label: "Home", icon: <Home size={16} /> },
  { to: "/proposals", label: "Proposals", icon: <Vote size={16} /> },
  { to: "/my-proposals", label: "My Proposals", icon: <FileText size={16} /> },
  { to: "/create", label: "Create", icon: <Plus size={16} /> },
  { to: "/faucet", label: "Faucet", icon: <Droplets size={16} /> },
  { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
  { to: "/delegate", label: "Delegate", icon: <Users size={16} /> },
  { to: "/leaderboard", label: "Leaderboard", icon: <Trophy size={16} /> },
  { to: "/treasury", label: "Treasury", icon: <Landmark size={16} /> },
  { to: "/about", label: "About", icon: <Info size={16} /> },
];

function WalletMenu({ publicKey, onDisconnect }: { publicKey: string; onDisconnect: () => void }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const copyAddress = () => {
    navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="wallet-badge wallet-badge-btn"
        aria-expanded={open}
      >
        <span className="wallet-dot" />
        {shortenAddress(publicKey)}
        <ChevronDown size={13} style={{ opacity: 0.6, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>

      {open && (
        <div className="wallet-dropdown">
          {/* Address */}
          <div className="wallet-dropdown-address">
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: 4, display: "block" }}>Connected wallet</span>
            <span style={{ fontFamily: "monospace", fontSize: "0.8125rem", wordBreak: "break-all" }}>
              {publicKey}
            </span>
          </div>

          <div className="wallet-dropdown-divider" />

          {/* Actions */}
          <button className="wallet-dropdown-item" onClick={copyAddress}>
            <Copy size={14} />
            {copied ? "Copied!" : "Copy address"}
          </button>

          <a
            className="wallet-dropdown-item"
            href={`https://stellar.expert/explorer/testnet/account/${publicKey}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
          >
            <ExternalLink size={14} />
            View on Stellar Expert
          </a>

          <div className="wallet-dropdown-divider" />

          <button
            className="wallet-dropdown-item wallet-dropdown-disconnect"
            onClick={() => { onDisconnect(); setOpen(false); }}
          >
            <LogOut size={14} />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const location = useLocation();
  const { wallet, loading, connect, disconnect } = useWallet();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

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
        <Link to="/" className="navbar-logo">
          <div className="navbar-logo-icon">P</div>
          PollChain
        </Link>

        <div className="navbar-links">
          {NAV_LINKS.map((l) => (
            <Link key={l.to} to={l.to} className={isActive(l.to)}>{l.label}</Link>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="wallet-btn-desktop">
            {loading ? (
              <div className="spinner" />
            ) : wallet.connected && wallet.publicKey ? (
              <WalletMenu publicKey={wallet.publicKey} onDisconnect={disconnect} />
            ) : (
              <button className="btn btn-primary btn-sm" onClick={connect}>
                Connect Wallet
              </button>
            )}
          </div>

          <button className="hamburger-btn" onClick={() => setMobileOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={mobileOpen}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div className={`mobile-drawer ${mobileOpen ? "mobile-drawer-open" : ""}`}>
        <div className="mobile-wallet">
          {loading ? (
            <div className="spinner" />
          ) : wallet.connected && wallet.publicKey ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--color-accent-lighter)", borderRadius: "var(--radius-md)" }}>
                <span className="wallet-dot" />
                <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-accent)", flex: 1, fontFamily: "monospace" }}>
                  {wallet.publicKey.slice(0, 10)}...{wallet.publicKey.slice(-6)}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => { navigator.clipboard.writeText(wallet.publicKey!); }}
                >
                  <Copy size={13} /> Copy
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => { disconnect(); setMobileOpen(false); }}
                >
                  <LogOut size={13} /> Disconnect
                </button>
              </div>
            </div>
          ) : (
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => { connect(); setMobileOpen(false); }}>
              Connect Wallet
            </button>
          )}
        </div>

        <div className="mobile-divider" />

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

      {mobileOpen && <div className="mobile-backdrop" onClick={() => setMobileOpen(false)} />}
    </nav>
  );
}
