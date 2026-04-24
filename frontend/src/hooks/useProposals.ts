import { useState, useEffect, useCallback } from "react";

// Mock data for demo — replace with actual Soroban contract calls
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

const MOCK_PROPOSALS: Proposal[] = [
  {
    id: 1,
    proposer: "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37",
    title: "Allocate 10,000 POLL to Community Development Fund",
    description:
      "This proposal seeks to allocate 10,000 POLL tokens from the treasury to fund community-driven development initiatives, including hackathons, educational content, and developer tooling for the PollChain ecosystem.",
    calldata: '{"action":"transfer","to":"treasury","amount":100000000000}',
    yes_votes: 450_0000000,
    no_votes: 120_0000000,
    abstain_votes: 30_0000000,
    start_ledger: 1000,
    end_ledger: 18280,
    status: "Active",
    created_at: Date.now() - 86400000,
  },
  {
    id: 2,
    proposer: "GBVNNPOFVV2YNXSQXDJPBVQYY6MZXFJGRQP7IQXKNG7Z7HQNMKJQXYZ",
    title: "Reduce Proposal Threshold to 50 POLL",
    description:
      "Lower the minimum token requirement to create a proposal from 100 POLL to 50 POLL, making governance more accessible to smaller token holders and increasing community participation.",
    calldata: '{"action":"update_config","proposal_threshold":500000000}',
    yes_votes: 800_0000000,
    no_votes: 200_0000000,
    abstain_votes: 50_0000000,
    start_ledger: 500,
    end_ledger: 17780,
    status: "Executed",
    created_at: Date.now() - 172800000,
  },
  {
    id: 3,
    proposer: "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGZXG5CPCJDGYVNO3LFPQZ",
    title: "Integrate Blend Protocol for Treasury Yield",
    description:
      "Propose integrating with Blend Protocol to generate yield on idle treasury funds. Estimated 8-12% APY on USDC holdings, generating sustainable revenue for the DAO.",
    calldata: '{"action":"integrate","protocol":"blend","amount":500000000000}',
    yes_votes: 100_0000000,
    no_votes: 900_0000000,
    abstain_votes: 200_0000000,
    start_ledger: 200,
    end_ledger: 17480,
    status: "Failed",
    created_at: Date.now() - 259200000,
  },
  {
    id: 4,
    proposer: "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37",
    title: "Launch PollChain Ambassador Program",
    description:
      "Establish a formal ambassador program to grow the PollChain community. Ambassadors will receive monthly POLL token grants in exchange for community building, content creation, and onboarding new members.",
    calldata: '{"action":"program","type":"ambassador","budget":200000000000}',
    yes_votes: 0,
    no_votes: 0,
    abstain_votes: 0,
    start_ledger: 2000,
    end_ledger: 19280,
    status: "Active",
    created_at: Date.now() - 3600000,
  },
];

export function useProposals() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate network delay
      await new Promise((r) => setTimeout(r, 600));
      setProposals(MOCK_PROPOSALS);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const getProposal = useCallback(
    (id: number) => proposals.find((p) => p.id === id),
    [proposals]
  );

  return { proposals, loading, error, refetch: fetchProposals, getProposal };
}

export function useStats() {
  return {
    totalProposals: MOCK_PROPOSALS.length,
    activeProposals: MOCK_PROPOSALS.filter((p) => p.status === "Active").length,
    executedProposals: MOCK_PROPOSALS.filter((p) => p.status === "Executed")
      .length,
    totalVoters: 1247,
    totalVotesCast: MOCK_PROPOSALS.reduce(
      (acc, p) => acc + p.yes_votes + p.no_votes + p.abstain_votes,
      0
    ),
  };
}
