import { useState, useEffect, useCallback } from "react";
import {
  fetchProposals,
  fetchProposalCount,
  fetchProposal,
  type RawProposal,
} from "../utils/contracts";

// ── Normalised Proposal type used by the UI ───────────────────────────────────

export interface Proposal {
  id: number;
  proposer: string;
  title: string;
  description: string;
  calldata: string;
  yes_votes: number;
  no_votes: number;
  abstain_votes: number;
  start_ledger: number;
  end_ledger: number;
  status: "Active" | "Passed" | "Failed" | "Executed" | "Cancelled";
  created_at: number;
}

function normalise(raw: RawProposal): Proposal {
  const statusTag =
    typeof raw.status === "object" && "tag" in raw.status
      ? (raw.status as { tag: string }).tag
      : String(raw.status);

  return {
    id: Number(raw.id),
    proposer: String(raw.proposer),
    title: String(raw.title),
    description: String(raw.description),
    calldata: String(raw.calldata),
    yes_votes: Number(raw.yes_votes),
    no_votes: Number(raw.no_votes),
    abstain_votes: Number(raw.abstain_votes),
    start_ledger: Number(raw.start_ledger),
    end_ledger: Number(raw.end_ledger),
    status: statusTag as Proposal["status"],
    created_at: Number(raw.created_at) * 1000, // contract stores unix seconds
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useProposals() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const count = await fetchProposalCount();
      if (count === 0) {
        setProposals([]);
        return;
      }
      // Fetch up to 50 proposals starting from #1
      const raws = await fetchProposals(1, Math.min(count, 50));
      setProposals(raws.map(normalise));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load proposals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const getProposal = useCallback(
    (id: number) => proposals.find((p) => p.id === id),
    [proposals]
  );

  return { proposals, loading, error, refetch: fetchAll, getProposal };
}

// ── Single proposal hook (for detail page) ────────────────────────────────────

export function useProposal(id: number) {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await fetchProposal(id);
      setProposal(raw ? normalise(raw) : null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load proposal");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return { proposal, loading, error, refetch: load };
}

// ── Stats hook ────────────────────────────────────────────────────────────────

export function useStats(proposals: Proposal[]) {
  return {
    totalProposals: proposals.length,
    activeProposals: proposals.filter((p) => p.status === "Active").length,
    executedProposals: proposals.filter((p) => p.status === "Executed").length,
    totalVotesCast: proposals.reduce(
      (acc, p) => acc + p.yes_votes + p.no_votes + p.abstain_votes,
      0
    ),
  };
}
