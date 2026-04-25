import { useState, useEffect } from "react";
import { Landmark, ArrowDownLeft, ArrowUpRight, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { useWallet } from "../hooks/useWallet";
import { fetchTreasuryBalance, fetchTreasuryTxs, depositTreasury } from "../utils/contracts";
import { formatPoll } from "../utils/stellar";
import { TOKEN_DECIMALS, TREASURY_CONTRACT_ID } from "../utils/constants";

interface TreasuryTx {
  kind: { tag: string };
  from_or_to: string;
  amount: bigint;
  ledger: number;
  timestamp: bigint;
}

export default function Treasury() {
  const { wallet, connect } = useWallet();
  const [balance, setBalance] = useState<bigint>(0n);
  const [txs, setTxs] = useState<TreasuryTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositing, setDepositing] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetchTreasuryBalance().then(setBalance),
      fetchTreasuryTxs().then((t) => setTxs(t as TreasuryTx[])),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDeposit = async () => {
    if (!wallet.publicKey || !depositAmount) return;
    setDepositing(true); setError(null); setTxHash(null);
    try {
      const amount = BigInt(Math.round(parseFloat(depositAmount) * 10 ** TOKEN_DECIMALS));
      const hash = await depositTreasury(wallet.publicKey, amount);
      setTxHash(hash);
      setDepositAmount("");
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Deposit failed");
    } finally { setDepositing(false); }
  };

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: 760 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 64, height: 64, background: "var(--color-accent-lighter)", borderRadius: "var(--radius-xl)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Landmark size={28} color="var(--color-accent)" />
          </div>
          <h1 style={{ marginBottom: 8 }}>DAO Treasury</h1>
          <p>Community-owned POLL token reserve. Withdrawals require a passed governance proposal.</p>
        </div>

        {/* Balance */}
        <div className="card" style={{ padding: 32, textAlign: "center", marginBottom: 20 }}>
          {loading ? (
            <div className="spinner" style={{ margin: "0 auto" }} />
          ) : (
            <>
              <div style={{ fontSize: "3rem", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--color-text-primary)" }}>
                {formatPoll(balance)}
              </div>
              <div style={{ color: "var(--color-text-muted)", marginBottom: 16 }}>POLL in Treasury</div>
              <a
                href={`https://stellar.expert/explorer/testnet/contract/${TREASURY_CONTRACT_ID}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "0.8125rem", color: "var(--color-accent)", display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                View on Stellar Expert <ExternalLink size={12} />
              </a>
            </>
          )}
        </div>

        {/* Deposit */}
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <h4 style={{ marginBottom: 16 }}>Deposit to Treasury</h4>
          {!wallet.connected ? (
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <p style={{ fontSize: "0.875rem" }}>Connect wallet to deposit.</p>
              <button className="btn btn-primary btn-sm" onClick={connect}>Connect</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  placeholder="Amount in POLL (e.g. 100)"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button className="btn btn-primary" onClick={handleDeposit} disabled={depositing || !depositAmount}>
                  {depositing ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Depositing...</> : "Deposit"}
                </button>
              </div>
              {txHash && (
                <div className="alert alert-success">
                  <CheckCircle size={14} /> Deposited!{" "}
                  <a href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", fontWeight: 700 }}>
                    View tx ↗
                  </a>
                </div>
              )}
              {error && <div className="alert alert-error"><AlertCircle size={14} /> {error}</div>}
            </div>
          )}
        </div>

        {/* Transaction log */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", fontWeight: 600 }}>
            Transaction History
          </div>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <div className="spinner" style={{ margin: "0 auto" }} />
            </div>
          ) : txs.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
              No transactions yet.
            </div>
          ) : (
            <div>
              {txs.map((tx, i) => {
                const isDeposit = tx.kind?.tag === "Deposit";
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: i < txs.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: isDeposit ? "#d1fae5" : "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {isDeposit ? <ArrowDownLeft size={16} color="var(--color-passed)" /> : <ArrowUpRight size={16} color="var(--color-failed)" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                        {isDeposit ? "Deposit" : "Withdrawal"}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        Ledger #{tx.ledger}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, color: isDeposit ? "var(--color-passed)" : "var(--color-failed)" }}>
                      {isDeposit ? "+" : "-"}{formatPoll(tx.amount)} POLL
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
