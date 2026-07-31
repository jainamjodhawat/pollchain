/**
 * PollChain's production Soroban transport.
 *
 * Read path:
 * React UI -> readContract -> Stellar RPC simulateTransaction -> decoded ScVal
 *
 * Write path:
 * React UI -> invokeContract -> RPC simulation -> Freighter signature
 * -> RPC submission -> confirmed transaction hash
 */
import {
  BASE_FEE,
  Contract,
  Keypair,
  TransactionBuilder,
  rpc,
  scValToNative,
  type xdr,
} from "@stellar/stellar-sdk";
import { NETWORK_PASSPHRASE, RPC_URL } from "../utils/constants";
import { signTx } from "../utils/wallet";

export const server = new rpc.Server(RPC_URL, { allowHttp: false });

export async function readContract(
  contractId: string,
  method: string,
  args: xdr.ScVal[] = []
): Promise<unknown> {
  if (!contractId) {
    throw new Error(`Missing contract ID for read method "${method}".`);
  }

  // Simulation does not need a funded account or a wallet signature.
  const dummy = Keypair.random();
  const dummyAccount = {
    accountId: () => dummy.publicKey(),
    sequenceNumber: () => "0",
    incrementSequenceNumber() {},
  };

  const transaction = new TransactionBuilder(dummyAccount as never, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(new Contract(contractId).call(method, ...args))
    .setTimeout(30)
    .build();

  const simulation = await server.simulateTransaction(transaction);
  if ("error" in simulation) {
    throw new Error(`Simulation error for "${method}": ${simulation.error}`);
  }

  const successful =
    simulation as rpc.Api.SimulateTransactionSuccessResponse;
  return successful.result
    ? scValToNative(successful.result.retval)
    : null;
}

export async function invokeContract(
  publicKey: string,
  contractId: string,
  method: string,
  args: xdr.ScVal[]
): Promise<string> {
  if (!contractId) {
    throw new Error(`Missing contract ID for write method "${method}".`);
  }

  const account = await server.getAccount(publicKey);
  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(new Contract(contractId).call(method, ...args))
    .setTimeout(30)
    .build();

  const simulation = await server.simulateTransaction(transaction);
  if ("error" in simulation) {
    throw new Error(`Simulation failed for "${method}": ${simulation.error}`);
  }

  const prepared = rpc
    .assembleTransaction(
      transaction,
      simulation as rpc.Api.SimulateTransactionSuccessResponse
    )
    .build();
  const signedXdr = await signTx(
    prepared.toXDR(),
    NETWORK_PASSPHRASE
  );
  const signedTransaction = TransactionBuilder.fromXDR(
    signedXdr,
    NETWORK_PASSPHRASE
  );
  const submission = await server.sendTransaction(signedTransaction);

  if (submission.status === "ERROR") {
    throw new Error(
      `Submission failed for "${method}": ${JSON.stringify(submission.errorResult)}`
    );
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, 1_500));
    const status = await server.getTransaction(submission.hash);

    if (status.status === rpc.Api.GetTransactionStatus.SUCCESS) {
      console.info(
        JSON.stringify({
          level: "info",
          event: "contract_transaction_confirmed",
          method,
          transactionHash: submission.hash,
          timestamp: new Date().toISOString(),
        })
      );
      return submission.hash;
    }
    if (status.status === rpc.Api.GetTransactionStatus.FAILED) {
      throw new Error(
        `Transaction failed on-chain. Hash: ${submission.hash}`
      );
    }
  }

  throw new Error(
    `Transaction confirmation timed out. Hash: ${submission.hash}`
  );
}
