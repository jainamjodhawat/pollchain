import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { useProposals } from "../hooks/useProposals";

const STORAGE_KEY = "pollchain_last_seen_count";

export default function NotificationBanner() {
  const { proposals } = useProposals();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (proposals.length === 0) return;
    const lastSeen = parseInt(localStorage.getItem(STORAGE_KEY) ?? "0", 10);
    const newCount = proposals.length - lastSeen;
    if (newCount > 0 && lastSeen > 0) {
      setMessage(
        `${newCount} new proposal${newCount > 1 ? "s" : ""} since your last visit!`
      );
    }
    localStorage.setItem(STORAGE_KEY, String(proposals.length));
  }, [proposals.length]);

  if (!message) return null;

  return (
    <div
      style={{
        background: "var(--color-accent)",
        color: "white",
        padding: "10px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        fontSize: "0.875rem",
        fontWeight: 500,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Bell size={15} />
        {message}
      </div>
      <button
        onClick={() => setMessage(null)}
        style={{ background: "none", border: "none", cursor: "pointer", color: "white", padding: 2 }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
