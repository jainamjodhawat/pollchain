import { useState, useEffect } from "react";
import { Users, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { useWallet } from "../hooks/useWallet";
import { usePollBalance } from "../hooks/usePollBalance";
import { fetchDelegate, fetchVotingPower, delegateTo, undelegateVotes } from "../utils/contracts";
import { formatPoll, shortenAddress } from "../utils/stellar";

export default function Delegate() {
  const { wallet, connect } = useWallet();
  const { balance } = usePollBalance(wallet.publicKey);
  const [currentDelegate, setCurrentDelegate] = useState<string | null>(null);
  const [votingPower, setVotingPower] = useState<bigint>(0n);
  const [delegateeInput, setDelegateeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!wallet.publicKey) return;
    fetchDelegate(wallet.publicKey).then(setCurrentDelegate);
    fetchVotingPower(wallet.publicKey).then(setVotingPower);
  }, [wallet.publicKey]);

  const handleDelegate = async () => {
    if (!wallet.publicKey || !delegateeInput.trim()) return;
    setLoading(true); setError(null); setTxHash(null);
    try {
      const hash = await delegateTo(wallet.publicKey, delegateeInput.trim());
      setTxHash(hash);
      setCurrentDelegate(delegateeInput.trim());
      setDelegateeInput("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Transaction failed");
    } finally { setLoading(false); }
  };

  const handleUndelegate = async () => {
    if (!wallet.publicKey) return;
    setLoading(true); setError(null); setTxHash(null);
    try {
      const hash = await undelegateVotes(wallet.publicKey);
      setTxHash(hash);
      setCurrentDelegate(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Transaction failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: 640 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 64, height: 64, background: "var(--color-accent-lighter)", borderRadius: "var(--radius-xl)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Users size={28} color="var(--color-accent)" />
          </div>
          <h1 style={{ marginBottom: 8 }}>Vote Delegation</h1>
          <p>Delegate your POLL voting power to a trusted community member.</p>
        </div>

        {!wallet.connected ? (
          <div className="card" style={{ padding: 32, textAlign: "center" }}>
            <p style={{ marginBottom: 20 }}>Connect your wallet to manage delegation.</p>
            <button className="btn btn-primary" onClick={connect}>Connect Wallet</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Stats */}
            <div className="stats-row">
              <div className="stat-item">
                <div className="stat-value">{formatPoll(balance)}</div>
                <div className="stat-label">Your POLL Balance</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{formatPoll(votingPower)}</div>
                <div className="stat-label">Total Voting Power</div>
              </div>
            </div>

            {/* Current delegation */}
            <div className="card" style={{ padding: 24 }}>
              <h4 style={{ marginBottom: 16 }}>Current Delegation</h4>
              {currentDelegate ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div className="alert alert-info">
                    <CheckCircle size={16} />
                    Delegated to{" "}
                    <strong style={{ fontFamily: "monospace" }}>
                      {shortenAddress(currentDelegate)}
                    </strong>
                  </div>
                  <button className="btn btn-danger" onClick={handleUndelegate} disabled={loading}>
                    {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Removing...</> : "Remove Delegation"}
                  </button>
                </div>
              ) : (
                <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                  You haven't delegated your votes. Your POLL balance votes directly.
                </p>
              )}
            </div>

            {/* Delegate to someone */}
            <div className="card" style={{ padding: 24 }}>
              <h4 style={{ marginBottom: 16 }}>
                {currentDelegate ? "Change Delegate" : "Delegate To"}
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Delegatee Stellar Address</label>
                  <input
                    className="form-input"
                    placeholder="G..."
                    value={delegateeInput}
                    onChange={(e) => setDelegateeInput(e.target.value)}
                  />
                  <span className="form-hint">
                    Enter the full Stellar address (starts with G) of the person you want to delegate to.
                  </span>
                </div>

                {txHash && (
                  <div className="alert alert-success">
                    <CheckCircle size={16} />
                    Done!{" "}
                    <a href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", fontWeight: 700 }}>
                      View tx <ExternalLink size={12} style={{ display: "inline" }} />
                    </a>
                  </div>
                )}
                {error && (
                  <div className="alert alert-error">
                    <AlertCircle size={16} /> {error}
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  onClick={handleDelegate}
                  disabled={loading || !delegateeInput.trim() || delegateeInput.trim().length < 56}
                >
                  {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Delegating...</> : "Delegate Votes"}
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="card" style={{ padding: 20 }}>
              <h4 style={{ marginBottom: 10 }}>How delegation works</h4>
              <ul style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", paddingLeft: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                <li>Your POLL balance is added to your delegate's voting power</li>
                <li>You can change or remove your delegate at any time</li>
                <li>Delegation is on-chain — recorded in the Delegation contract</li>
                <li>You can still create proposals even while delegating</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
