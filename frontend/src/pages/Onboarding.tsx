import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Circle,
  Copy,
  ExternalLink,
  Rocket,
  ShieldCheck,
  Wallet,
  Coins,
  Vote,
} from "lucide-react";
import { useWallet } from "../hooks/useWallet";
import { usePollBalance } from "../hooks/usePollBalance";
import { formatPoll, shortenAddress } from "../utils/stellar";

export default function Onboarding() {
  const { wallet, loading, connect } = useWallet();
  const { balance, loading: balanceLoading } = usePollBalance(wallet.publicKey);
  const [copied, setCopied] = useState(false);

  const hasWallet = Boolean(wallet.connected && wallet.publicKey);
  const hasPoll = balance > 0n;
  const completedSteps = Number(hasWallet) + Number(hasPoll);

  const copyAddress = async () => {
    if (!wallet.publicKey) return;
    await navigator.clipboard.writeText(wallet.publicKey);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const steps = [
    {
      number: "01",
      title: "Connect a testnet wallet",
      description:
        "Unlock Freighter, switch it to Stellar Testnet, and approve PollChain. Never share your recovery phrase.",
      complete: hasWallet,
      icon: <Wallet size={22} />,
      action: hasWallet ? (
        <div className="onboarding-wallet-proof">
          <span>{shortenAddress(wallet.publicKey!)}</span>
          <button className="btn btn-ghost btn-sm" onClick={copyAddress}>
            <Copy size={14} /> {copied ? "Copied" : "Copy"}
          </button>
        </div>
      ) : (
        <button className="btn btn-primary" onClick={connect} disabled={loading}>
          {loading ? <span className="spinner" /> : <Wallet size={16} />}
          Connect Freighter
        </button>
      ),
    },
    {
      number: "02",
      title: "Claim POLL voting power",
      description:
        "Use the on-chain faucet to receive test POLL. The confirmed transaction becomes your first activity proof.",
      complete: hasPoll,
      icon: <Coins size={22} />,
      action: hasPoll ? (
        <div className="onboarding-balance">
          <Check size={15} /> {balanceLoading ? "Checking balance…" : `${formatPoll(balance)} POLL available`}
        </div>
      ) : (
        <Link className={`btn btn-primary ${!hasWallet ? "onboarding-action-disabled" : ""}`} to={hasWallet ? "/faucet" : "/onboarding"}>
          Open faucet <ArrowRight size={15} />
        </Link>
      ),
    },
    {
      number: "03",
      title: "Make one meaningful decision",
      description:
        "Vote on a proposal, create one, delegate voting power, or fund the treasury. Save the StellarExpert link after confirmation.",
      complete: false,
      icon: <Vote size={22} />,
      action: (
        <div className="onboarding-action-row">
          <Link className={`btn btn-primary ${!hasPoll ? "onboarding-action-disabled" : ""}`} to={hasPoll ? "/proposals" : "/onboarding"}>
            Browse proposals <ArrowRight size={15} />
          </Link>
          <Link className="btn btn-secondary" to="/create">Create instead</Link>
        </div>
      ),
    },
  ];

  return (
    <main className="page-wrapper onboarding-page">
      <div className="container onboarding-container">
        <section className="onboarding-hero">
          <div className="section-eyebrow"><Rocket size={14} /> First transaction guide</div>
          <h1>From a new wallet to an on-chain vote.</h1>
          <p>
            Complete this testnet trail in about three minutes. PollChain keeps
            every step explicit so first-time users always know what happens next.
          </p>
          <div className="onboarding-progress" aria-label={`${completedSteps} of 3 onboarding steps complete`}>
            <div className="onboarding-progress-track">
              <span style={{ width: `${(completedSteps / 3) * 100}%` }} />
            </div>
            <strong>{completedSteps}/3 ready</strong>
          </div>
        </section>

        <div className="onboarding-layout">
          <section className="onboarding-trail" aria-label="Onboarding steps">
            {steps.map((step) => (
              <article className={`onboarding-step ${step.complete ? "onboarding-step-complete" : ""}`} key={step.number}>
                <div className="onboarding-step-marker" aria-hidden="true">
                  {step.complete ? <Check size={18} /> : <Circle size={14} />}
                </div>
                <div className="onboarding-step-content">
                  <div className="onboarding-step-label">
                    <span>{step.number}</span>
                    <span className="onboarding-step-icon">{step.icon}</span>
                  </div>
                  <h2>{step.title}</h2>
                  <p>{step.description}</p>
                  <div className="onboarding-step-action">{step.action}</div>
                </div>
              </article>
            ))}
          </section>

          <aside className="onboarding-proof-card">
            <ShieldCheck size={26} />
            <div>
              <span className="section-eyebrow">Proof checklist</span>
              <h2>Keep public proof, keep secrets private.</h2>
            </div>
            <ul>
              <li>Public wallet address beginning with G</li>
              <li>Confirmed transaction hash and StellarExpert URL</li>
              <li>Interaction type and timestamp</li>
              <li>Never a secret key, password, or recovery phrase</li>
            </ul>
            {wallet.publicKey && (
              <a
                className="btn btn-secondary"
                href={`https://stellar.expert/explorer/testnet/account/${wallet.publicKey}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View your testnet account <ExternalLink size={14} />
              </a>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
