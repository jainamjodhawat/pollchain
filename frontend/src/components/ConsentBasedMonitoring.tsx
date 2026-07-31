import { lazy, Suspense, useState } from "react";

type AnalyticsConsent = "granted" | "denied" | null;

const CONSENT_KEY = "pollchain-analytics-consent:v1";
const analyticsEnabled =
  import.meta.env.VITE_ENABLE_ANALYTICS === "true";
const Analytics = lazy(() =>
  import("@vercel/analytics/react").then((module) => ({
    default: module.Analytics,
  }))
);
const SpeedInsights = lazy(() =>
  import("@vercel/speed-insights/react").then((module) => ({
    default: module.SpeedInsights,
  }))
);

function readConsent(): AnalyticsConsent {
  if (!analyticsEnabled) return "denied";
  const saved = window.localStorage.getItem(CONSENT_KEY);
  return saved === "granted" || saved === "denied" ? saved : null;
}

export default function ConsentBasedMonitoring() {
  const [consent, setConsent] = useState<AnalyticsConsent>(readConsent);

  if (!analyticsEnabled) return null;

  if (consent === "granted") {
    return (
      <Suspense fallback={null}>
        <Analytics />
        <SpeedInsights />
      </Suspense>
    );
  }

  if (consent === "denied") return null;

  const choose = (choice: Exclude<AnalyticsConsent, null>) => {
    window.localStorage.setItem(CONSENT_KEY, choice);
    setConsent(choice);
  };

  return (
    <aside
      className="analytics-consent"
      aria-label="Privacy-friendly analytics choice"
    >
      <p>
        Help improve PollChain by sharing anonymous page-view and performance
        data with Vercel. Wallet addresses and transaction details are never
        included.
      </p>
      <div className="analytics-consent-actions">
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => choose("granted")}
        >
          Allow analytics
        </button>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={() => choose("denied")}
        >
          No thanks
        </button>
      </div>
    </aside>
  );
}
