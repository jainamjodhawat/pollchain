import { useState, useEffect } from "react";
import { Droplets, CheckCircle, Clock, ExternalLink, AlertCircle } from "lucide-react";
import { useWallet } from "../hooks/useWallet";
import { usePollBalance } from "../hooks/usePollBalance";
import {
  claimFaucet,
  fetchLastClaim,
  fetchFaucetReserve,
} from "../utils/contracts";
import { formatPoll } from "../utils/stellar";

const COOLDOWN_LEDGERS = 17280; // ~1 day
const CLAIM_AMOUNT = 1000; // POLL

export default function Faucet() {
  const { wallet, connect } = useWallet();
  const { balance, loading: balLoading } = usePollBalance(wallet.publicKey);

  const [lastClaim, setLastClaim] = useState<number | null>(null);
  const [currentLedger, setCurrentLedger] = useState<number>(0);
  const [reserve, setReserve] = useState<bigint>(0n);
  const [claiming, setClaiming] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  useEffect(() => {
    fetchFaucetReserve().then(setReserve);
    // Get current ledger from horizon
    fetch("https://horizon-testnet.stellar.org/")
      .then((r) => r.json())
      .then((d) => setCurrentLedger(d.core_latest_ledger ?? 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!wallet.publicKey) return;
    setLoadingStatus(true);
    fetchLastClaim(wallet.publicKey)
      .then(setLastClaim)
      .finally(() => setLoadingStatus(false));
  }, [wallet.publicKey]);

  const ledgersRemaining =
    lastClaim != null
      ? Math.max(0, COOLDOWN_LEDGERS - (currentLedger - lastClaim))
      : 0;
  const canClaim = lastClaim === null || ledgersRemaining === 0;
  const hoursRemaining = Math.ceil((ledgersRemaining * 5) / 3600);

  const handleClaim = async () => {
    if (!wallet.publicKey) return;
    setClaiming(true);
    setError(null);
    setTxHash(null);
    try {
      const hash = await claimFaucet(wallet.publicKey);
      setTxHash(hash);
      setLastClaim(currentLedger);
      // Refresh reserve
      fetchFaucetReserve().then(setReserve);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Claim failed");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: 640 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              width: 64,
              height: 64,
              background: "var(--color-accent-lighter)",
              borderRadius: "var(--radius-xl)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <Droplets size={28} color="var(--color-accent)" />
          </div>
          <h1 style={{ marginBottom: 8 }}>POLL Faucet</h1>
          <p>
            Claim free POLL tokens to participate in PollChain governance.
            One claim per day per wallet.
          </p>
        </div>

        {/* Stats row */}
        <div className="stats-row" style={{ marginBottom: 24 }}>
          <div className="stat-item">
            <div className="stat-value">{formatPoll(reserve)}</div>
            <div className="stat-label">Faucet Reserve (POLL)</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{CLAIM_AMOUNT.toLocaleString()}</div>
            <div className="stat-label">Per Claim (POLL)</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">~1 day</div>
            <div className="stat-label">Cooldown Period</div>
          </div>
        </div>

        {/* Main card */}
        <div className="card" style={{ padding: 32 }}>
          {!wallet.connected ? (
            <div style={{ textAlign: "center" }}>
              <p style={{ marginBottom: 20 }}>
                Connect your Freighter wallet to claim POLL tokens.
              </p>
              <button className="btn btn-primary btn-lg" onClick={connect}>
                Connect Wallet
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Balance */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  background: "var(--color-bg)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.875rem",
                }}
              >
                <span style={{ color: "var(--color-text-muted)" }}>
                  Your POLL balance
                </span>
                <span style={{ fontWeight: 700, color: "var(--color-accent)" }}>
                  {balLoading ? "..." : `${formatPoll(balance)} POLL`}
                </span>
              </div>

              {/* Cooldown status */}
              {loadingStatus ? (
                <div style={{ textAlign: "center" }}>
                  <div className="spinner" style={{ margin: "0 auto" }} />
                </div>
              ) : canClaim ? (
                <div className="alert alert-success">
                  <CheckCircle size={16} />
                  You can claim {CLAIM_AMOUNT.toLocaleString()} POLL right now!
                </div>
              ) : (
                <div className="alert alert-info">
                  <Clock size={16} />
                  Next claim available in ~{hoursRemaining} hour
                  {hoursRemaining !== 1 ? "s" : ""} ({ledgersRemaining.toLocaleString()} ledgers)
                </div>
              )}

              {/* Success */}
              {txHash && (
                <div className="alert alert-success">
                  <CheckCircle size={16} />
                  Claimed {CLAIM_AMOUNT.toLocaleString()} POLL!{" "}
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "inherit",
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    View tx <ExternalLink size={12} />
                  </a>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="alert alert-error">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {/* Claim button */}
              <button
                className="btn btn-primary btn-lg"
                onClick={handleClaim}
                disabled={!canClaim || claiming || reserve === 0n}
                style={{ width: "100%" }}
              >
                {claiming ? (
                  <>
                    <span className="spinner" style={{ width: 18, height: 18 }} />
                    Claiming on-chain...
                  </>
                ) : (
                  <>
                    <Droplets size={18} />
                    Claim {CLAIM_AMOUNT.toLocaleString()} POLL
                  </>
                )}
              </button>

              {reserve === 0n && (
                <p
                  style={{
                    textAlign: "center",
                    fontSize: "0.8125rem",
                    color: "var(--color-failed)",
                  }}
                >
                  Faucet is empty. Check back later.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="card" style={{ padding: 24, marginTop: 16 }}>
          <h4 style={{ marginBottom: 12 }}>How it works</h4>
          <ul
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-secondary)",
              paddingLeft: 20,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <li>Connect your Freighter wallet</li>
            <li>Click Claim — Freighter will ask you to sign a transaction</li>
            <li>
              {CLAIM_AMOUNT.toLocaleString()} POLL tokens are sent to your wallet
              on Stellar Testnet
            </li>
            <li>Wait ~1 day (17,280 ledgers) before claiming again</li>
            <li>
              Use POLL to create proposals (100 POLL min) and vote on governance
              decisions
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
