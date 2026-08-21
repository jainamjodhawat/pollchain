import { useState } from "react";
import { CheckCircle2, Copy, ExternalLink } from "lucide-react";
import { shortenAddress } from "../utils/stellar";

interface TransactionReceiptProps {
  action: string;
  hash: string;
  publicKey?: string | null;
  compact?: boolean;
}

export default function TransactionReceipt({
  action,
  hash,
  publicKey,
  compact = false,
}: TransactionReceiptProps) {
  const [copied, setCopied] = useState(false);
  const explorerUrl = `https://stellar.expert/explorer/testnet/tx/${hash}`;

  const copyProof = async () => {
    const proof = [
      `PollChain action: ${action}`,
      publicKey ? `Wallet: ${publicKey}` : null,
      `Transaction: ${hash}`,
      `StellarExpert: ${explorerUrl}`,
    ].filter(Boolean).join("\n");
    await navigator.clipboard.writeText(proof);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section className={`transaction-receipt ${compact ? "transaction-receipt-compact" : ""}`} aria-label="Confirmed transaction receipt">
      <div className="transaction-receipt-status">
        <CheckCircle2 size={20} />
        <div>
          <strong>{action} confirmed</strong>
          <span>Recorded on Stellar Testnet</span>
        </div>
      </div>
      <dl>
        {publicKey && (
          <div>
            <dt>Wallet</dt>
            <dd title={publicKey}>{shortenAddress(publicKey)}</dd>
          </div>
        )}
        <div>
          <dt>Transaction</dt>
          <dd title={hash}>{hash.slice(0, 10)}…{hash.slice(-8)}</dd>
        </div>
      </dl>
      <div className="transaction-receipt-actions">
        <button className="btn btn-ghost btn-sm" onClick={copyProof}>
          <Copy size={14} /> {copied ? "Proof copied" : "Copy proof"}
        </button>
        <a className="btn btn-secondary btn-sm" href={explorerUrl} target="_blank" rel="noopener noreferrer">
          StellarExpert <ExternalLink size={13} />
        </a>
      </div>
    </section>
  );
}
