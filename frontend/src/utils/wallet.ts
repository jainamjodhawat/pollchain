import {
  isConnected,
  requestAccess,
  signTransaction,
} from "@stellar/freighter-api";

export interface WalletState {
  connected: boolean;
  publicKey: string | null;
  error: string | null;
}

export async function checkWalletConnection(): Promise<WalletState> {
  try {
    const connectedResult = await isConnected();
    // freighter-api v3+ returns { isConnected: boolean }
    const connected =
      typeof connectedResult === "boolean"
        ? connectedResult
        : (connectedResult as { isConnected: boolean }).isConnected;

    if (!connected) {
      return { connected: false, publicKey: null, error: null };
    }

    const accessResult = await requestAccess();
    const publicKey =
      typeof accessResult === "string"
        ? accessResult
        : (accessResult as { address: string }).address;

    return { connected: true, publicKey, error: null };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { connected: false, publicKey: null, error: msg };
  }
}

export async function connectWallet(): Promise<WalletState> {
  try {
    const accessResult = await requestAccess();
    const publicKey =
      typeof accessResult === "string"
        ? accessResult
        : (accessResult as { address: string }).address;
    return { connected: true, publicKey, error: null };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { connected: false, publicKey: null, error: msg };
  }
}

export async function signTx(
  xdr: string,
  networkPassphrase: string
): Promise<string> {
  const result = await signTransaction(xdr, { networkPassphrase });
  if (typeof result === "string") return result;
  return (result as { signedTxXdr: string }).signedTxXdr;
}
