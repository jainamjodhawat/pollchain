import { useState, useEffect, useCallback } from "react";
import {
  fetchProposals,
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
  tags: string[];
}

let proposalCache: Proposal[] | null = null;
let proposalRequest: Promise<Proposal[]> | null = null;

async function loadProposalList(force = false): Promise<Proposal[]> {
  if (!force && proposalCache) return proposalCache;
  if (proposalRequest) return proposalRequest;

  const request = fetchProposals(1, 50).then((raws) => raws.map(normalise));
  proposalRequest = request;
  try {
    const proposals = await request;
    proposalCache = proposals;
    return proposals;
  } finally {
    proposalRequest = null;
  }
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
    created_at: Number(raw.created_at) * 1000,
    tags: (() => {
      try {
        const parsed = JSON.parse(String(raw.calldata));
        return Array.isArray(parsed.tags) ? parsed.tags : [];
      } catch { return []; }
    })(),
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useProposals() {
  const [proposals, setProposals] = useState<Proposal[]>(() => proposalCache ?? []);
  const [loading, setLoading] = useState(proposalCache === null);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async (force = false) => {
    // Keep cached content visible while a newer chain read is in flight.
    if (proposalCache === null) setLoading(true);
    setError(null);
    try {
      const next = await loadProposalList(force);
      setProposals(next);
      return next;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load proposals");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll(proposalCache !== null);
  }, [fetchAll]);

  const getProposal = useCallback(
    (id: number) => proposals.find((p) => p.id === id),
    [proposals]
  );

  const refetch = useCallback(() => fetchAll(true), [fetchAll]);

  return { proposals, loading, error, refetch, getProposal };
}

// ── Single proposal hook (for detail page) ────────────────────────────────────

export function useProposal(id: number) {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (showLoading = true): Promise<Proposal | null> => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const raw = await fetchProposal(id);
      const nextProposal = raw ? normalise(raw) : null;
      setProposal(nextProposal);
      return nextProposal;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load proposal");
      return null;
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const refetch = useCallback(() => load(false), [load]);

  return { proposal, loading, error, refetch };
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
