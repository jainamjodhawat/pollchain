import { TOKEN_DECIMALS } from "./constants";

export function formatPoll(raw: bigint | number): string {
  const val = Number(raw) / 10 ** TOKEN_DECIMALS;
  return val.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function parsePoll(human: number): bigint {
  return BigInt(Math.round(human * 10 ** TOKEN_DECIMALS));
}

export function shortenAddress(addr: string): string {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    Active: "Active",
    Passed: "Passed",
    Failed: "Failed",
    Executed: "Executed",
    Cancelled: "Cancelled",
  };
  return map[status] || status;
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    Active: "status-active",
    Passed: "status-passed",
    Failed: "status-failed",
    Executed: "status-executed",
    Cancelled: "status-cancelled",
  };
  return map[status] || "status-default";
}

export function votePercentage(
  yes: bigint | number,
  no: bigint | number,
  abstain: bigint | number
): { yes: number; no: number; abstain: number } {
  const total = Number(yes) + Number(no) + Number(abstain);
  if (total === 0) return { yes: 0, no: 0, abstain: 0 };
  return {
    yes: Math.round((Number(yes) / total) * 100),
    no: Math.round((Number(no) / total) * 100),
    abstain: Math.round((Number(abstain) / total) * 100),
  };
}
