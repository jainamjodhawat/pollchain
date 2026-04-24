import { Link, useLocation } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { shortenAddress } from "../utils/stellar";

export default function Navbar() {
  const location = useLocation();
  const { wallet, loading, connect } = useWallet();

  const isActive = (path: string) =>
    location.pathname === path ? "navbar-link active" : "navbar-link";

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="navbar-logo-icon">P</div>
          PollChain
        </Link>

        {/* Nav links */}
        <div className="navbar-links">
          <Link to="/" className={isActive("/")}>
            Home
          </Link>
          <Link to="/proposals" className={isActive("/proposals")}>
            Proposals
          </Link>
          <Link to="/create" className={isActive("/create")}>
            Create
          </Link>
          <Link to="/about" className={isActive("/about")}>
            About
          </Link>
        </div>

        {/* Wallet button */}
        <div>
          {loading ? (
            <div className="spinner" />
          ) : wallet.connected && wallet.publicKey ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "var(--color-accent-lighter)",
                padding: "6px 14px",
                borderRadius: "var(--radius-full)",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--color-accent)",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--color-passed)",
                  display: "inline-block",
                }}
              />
              {shortenAddress(wallet.publicKey)}
            </div>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={connect}>
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
