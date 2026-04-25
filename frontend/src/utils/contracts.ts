/**
 * PollChain — Real Soroban contract client (Stellar SDK v15)
 *
 * Reads  → RPC simulation (no wallet, no fee)
 * Writes → build tx → Freighter sign → submit → poll for confirmation
 */

import {
  Contract,
  TransactionBuilder,
  BASE_FEE,
  nativeToScVal,
  scValToNative,
  Address,
  xdr,
  Keypair,
  rpc,
} from "@stellar/stellar-sdk";
import {
  NETWORK_PASSPHRASE,
  RPC_URL,
  VOTING_CONTRACT_ID,
  GOVERNANCE_TOKEN_CONTRACT_ID,
} from "./constants";
import { signTx } from "./wallet";

export const server = new rpc.Server(RPC_URL, { allowHttp: false });

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

// ── Simulate a read-only call ─────────────────────────────────────────────────

async function simulateRead(
  contractId: string,
  method: string,
  args: xdr.ScVal[] = []
): Promise<unknown> {
  // Use a random keypair — simulation doesn't need a funded account
  const dummy = Keypair.random();
  const dummyAccount = {
    accountId: () => dummy.publicKey(),
    sequenceNumber: () => "0",
    incrementSequenceNumber() {},
  };

  const contract = new Contract(contractId);
  const tx = new TransactionBuilder(dummyAccount as any, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);

  if ("error" in sim) {
    throw new Error(`Simulation error: ${(sim as any).error}`);
  }

  const successSim = sim as rpc.Api.SimulateTransactionSuccessResponse;
  if (!successSim.result) return null;
  return scValToNative(successSim.result.retval);
}

// ── Build, sign, submit, confirm ──────────────────────────────────────────────

export async function invokeContract(
  publicKey: string,
  contractId: string,
  method: string,
  args: xdr.ScVal[]
): Promise<string> {
  const account = await server.getAccount(publicKey);
  const contract = new Contract(contractId);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  // Simulate to get soroban data + accurate fee
  const sim = await server.simulateTransaction(tx);
  if ("error" in sim) {
    throw new Error(`Simulation failed: ${(sim as any).error}`);
  }

  const preparedTx = rpc
    .assembleTransaction(tx, sim as rpc.Api.SimulateTransactionSuccessResponse)
    .build();

  // Sign via Freighter
  const signedXdr = await signTx(preparedTx.toXDR(), NETWORK_PASSPHRASE);

  // Submit
  const submitResult = await server.sendTransaction(
    TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE) as any
  );

  if (submitResult.status === "ERROR") {
    throw new Error(`Submit failed: ${JSON.stringify(submitResult.errorResult)}`);
  }

  // Poll for confirmation (up to 30s)
  const hash = submitResult.hash;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const status = await server.getTransaction(hash);
    if (status.status === rpc.Api.GetTransactionStatus.SUCCESS) return hash;
    if (status.status === rpc.Api.GetTransactionStatus.FAILED) {
      throw new Error(`Transaction failed on-chain. Hash: ${hash}`);
    }
  }
  throw new Error("Transaction timed out. Check Stellar Expert for status.");
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
  // Soroban enum: { tag: "Yes" | "No" | "Abstain", values: void[] }
  const choiceScVal = xdr.ScVal.scvVec([
    xdr.ScVal.scvSymbol(choice),
  ]);
  return invokeContract(publicKey, VOTING_CONTRACT_ID, "vote", [
    addressVal(publicKey),
    u64Val(proposalId),
    choiceScVal,
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
