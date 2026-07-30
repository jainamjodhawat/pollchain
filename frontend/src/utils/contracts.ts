/**
 * PollChain — Real Soroban contract client (Stellar SDK v15)
 *
 * Reads  → RPC simulation (no wallet, no fee)
 * Writes → build tx → Freighter sign → submit → poll for confirmation
 */

import {
  nativeToScVal,
  Address,
  xdr,
} from "@stellar/stellar-sdk";
import {
  VOTING_CONTRACT_ID,
  GOVERNANCE_TOKEN_CONTRACT_ID,
} from "./constants";
import {
  invokeContract,
  readContract as simulateRead,
  server,
} from "../integrations/sorobanClient";

export { invokeContract, server };

// ── ScVal helpers ─────────────────────────────────────────────────────────────

function addressVal(addr: string): xdr.ScVal {
  return new Address(addr).toScVal();
}

function u64Val(n: number | bigint): xdr.ScVal {
  return nativeToScVal(BigInt(n), { type: "u64" });
}

function strVal(s: string): xdr.ScVal {
  return nativeToScVal(s, { type: "string" });
}

function voteChoiceVal(choice: "Yes" | "No" | "Abstain"): xdr.ScVal {
  // Soroban unit enums are encoded as a one-element vector containing the
  // variant symbol. Keep this conversion in one place so every option,
  // including "No", has the same validated wire shape.
  return xdr.ScVal.scvVec([xdr.ScVal.scvSymbol(choice)]);
}

// ── Voting contract — reads ───────────────────────────────────────────────────

export interface RawProposal {
  id: bigint;
  proposer: string;
  title: string;
  description: string;
  calldata: string;
  yes_votes: bigint;
  no_votes: bigint;
  abstain_votes: bigint;
  start_ledger: number;
  end_ledger: number;
  status: { tag: string } | string;
  created_at: bigint;
}

export async function fetchProposalCount(): Promise<number> {
  const result = await simulateRead(VOTING_CONTRACT_ID, "proposal_count");
  return Number(result ?? 0);
}

export async function fetchProposal(id: number): Promise<RawProposal | null> {
  try {
    const result = await simulateRead(VOTING_CONTRACT_ID, "get_proposal", [
      u64Val(id),
    ]);
    return result as RawProposal;
  } catch {
    return null;
  }
}

export async function fetchProposals(
  from: number,
  limit: number
): Promise<RawProposal[]> {
  try {
    const result = await simulateRead(VOTING_CONTRACT_ID, "get_proposals", [
      u64Val(from),
      u64Val(limit),
    ]);
    return (result as RawProposal[]) ?? [];
  } catch {
    return [];
  }
}

export async function fetchVote(
  proposalId: number,
  voter: string
): Promise<{ tag: string } | null> {
  try {
    const result = await simulateRead(VOTING_CONTRACT_ID, "get_vote", [
      u64Val(proposalId),
      addressVal(voter),
    ]);
    if (!result) return null;
    // result is a VoteRecord — extract the choice field
    const record = result as { choice: { tag: string } };
    return record.choice ?? null;
  } catch {
    return null;
  }
}

// ── Token — reads ─────────────────────────────────────────────────────────────

export async function fetchTokenBalance(address: string): Promise<bigint> {
  try {
    const result = await simulateRead(
      GOVERNANCE_TOKEN_CONTRACT_ID,
      "balance",
      [addressVal(address)]
    );
    return BigInt(result as string | number | bigint);
  } catch {
    return 0n;
  }
}

export async function fetchTotalSupply(): Promise<bigint> {
  try {
    const result = await simulateRead(
      GOVERNANCE_TOKEN_CONTRACT_ID,
      "total_supply"
    );
    return BigInt(result as string | number | bigint);
  } catch {
    return 0n;
  }
}

// ── Voting contract — writes ──────────────────────────────────────────────────

export async function createProposal(
  publicKey: string,
  title: string,
  description: string,
  calldata: string
): Promise<string> {
  return invokeContract(publicKey, VOTING_CONTRACT_ID, "create_proposal", [
    addressVal(publicKey),
    strVal(title),
    strVal(description),
    strVal(calldata),
  ]);
}

export async function castVote(
  publicKey: string,
  proposalId: number,
  choice: "Yes" | "No" | "Abstain"
): Promise<string> {
  return invokeContract(publicKey, VOTING_CONTRACT_ID, "vote", [
    addressVal(publicKey),
    u64Val(proposalId),
    voteChoiceVal(choice),
  ]);
}

export async function finalizeProposal(
  publicKey: string,
  proposalId: number
): Promise<string> {
  return invokeContract(publicKey, VOTING_CONTRACT_ID, "finalize", [
    u64Val(proposalId),
  ]);
}

// ── Faucet contract ───────────────────────────────────────────────────────────

import { FAUCET_CONTRACT_ID } from "./constants";

export async function fetchFaucetConfig() {
  return simulateRead(FAUCET_CONTRACT_ID, "get_config");
}

export async function fetchLastClaim(address: string): Promise<number | null> {
  try {
    const result = await simulateRead(FAUCET_CONTRACT_ID, "get_last_claim", [
      addressVal(address),
    ]);
    return result != null ? Number(result) : null;
  } catch {
    return null;
  }
}

export async function fetchFaucetReserve(): Promise<bigint> {
  try {
    const result = await simulateRead(FAUCET_CONTRACT_ID, "get_reserve");
    return BigInt(result as string | number | bigint);
  } catch {
    return 0n;
  }
}

export async function claimFaucet(publicKey: string): Promise<string> {
  return invokeContract(publicKey, FAUCET_CONTRACT_ID, "claim", [
    addressVal(publicKey),
  ]);
}

// ── Treasury contract ─────────────────────────────────────────────────────────

import { TREASURY_CONTRACT_ID, DELEGATION_CONTRACT_ID } from "./constants";

export async function fetchTreasuryBalance(): Promise<bigint> {
  try {
    const r = await simulateRead(TREASURY_CONTRACT_ID, "get_balance");
    return BigInt(r as string | number | bigint);
  } catch { return 0n; }
}

export async function fetchTreasuryTxs(): Promise<unknown[]> {
  try {
    return (await simulateRead(TREASURY_CONTRACT_ID, "get_transactions") as unknown[]) ?? [];
  } catch { return []; }
}

export async function depositTreasury(publicKey: string, amount: bigint): Promise<string> {
  return invokeContract(publicKey, TREASURY_CONTRACT_ID, "deposit", [
    addressVal(publicKey),
    nativeToScVal(amount, { type: "i128" }),
  ]);
}

// ── Delegation contract ───────────────────────────────────────────────────────

export async function fetchDelegate(address: string): Promise<string | null> {
  try {
    const r = await simulateRead(DELEGATION_CONTRACT_ID, "get_delegate", [addressVal(address)]);
    return r ? String(r) : null;
  } catch { return null; }
}

export async function fetchVotingPower(address: string): Promise<bigint> {
  try {
    const r = await simulateRead(DELEGATION_CONTRACT_ID, "get_voting_power", [addressVal(address)]);
    return BigInt(r as string | number | bigint);
  } catch { return 0n; }
}

export async function delegateTo(publicKey: string, delegatee: string): Promise<string> {
  return invokeContract(publicKey, DELEGATION_CONTRACT_ID, "delegate", [
    addressVal(publicKey),
    addressVal(delegatee),
  ]);
}

export async function undelegateVotes(publicKey: string): Promise<string> {
  return invokeContract(publicKey, DELEGATION_CONTRACT_ID, "undelegate", [
    addressVal(publicKey),
  ]);
}

// ── Added config and delegator fetchers for Governance Analytics UI ───────────

export interface VotingConfig {
  admin: string;
  token: string;
  execution_contract: string;
  delegation_contract: string;
  treasury_contract: string;
  reward_amount: bigint;
  quadratic_voting: boolean;
  proposal_threshold: bigint;
  voting_period: number;
  quorum: bigint;
}

export async function fetchVotingConfig(): Promise<VotingConfig | null> {
  try {
    const result = await simulateRead(VOTING_CONTRACT_ID, "get_config");
    return result as VotingConfig;
  } catch {
    return null;
  }
}

export async function fetchDelegators(address: string): Promise<string[]> {
  try {
    const r = await simulateRead(DELEGATION_CONTRACT_ID, "get_delegators", [addressVal(address)]);
    return (r as string[]) ?? [];
  } catch {
    return [];
  }
}
