import {
  getAddress,
  isAllowed,
  isConnected,
  setAllowed,
  signTransaction,
} from "@stellar/freighter-api";

export interface WalletState {
  connected: boolean;
  publicKey: string | null;
  error: string | null;
}

function responseError(response: { error?: unknown }): string | null {
  if (!response.error) return null;
  return response.error instanceof Error
    ? response.error.message
    : String(response.error);
}

function unavailableState(message: string): WalletState {
  return { connected: false, publicKey: null, error: message };
}

export async function checkWalletConnection(): Promise<WalletState> {
  try {
    const connection = await isConnected();
    const connectionError = responseError(connection);
    if (connectionError || !connection.isConnected) {
      return { connected: false, publicKey: null, error: null };
    }

    // Passive checks must never open Freighter or request permission. Doing so
    // on every page mount made connection appear unreliable.
    const permission = await isAllowed();
    if (responseError(permission) || !permission.isAllowed) {
      return { connected: false, publicKey: null, error: null };
    }

    const address = await getAddress();
    const addressError = responseError(address);
    if (addressError || !address.address) {
      return unavailableState(addressError ?? "Freighter did not return an account address.");
    }

    return { connected: true, publicKey: address.address, error: null };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return unavailableState(msg);
  }
}

export async function connectWallet(): Promise<WalletState> {
  try {
    const connection = await isConnected();
    if (responseError(connection) || !connection.isConnected) {
      return unavailableState("Freighter is unavailable. Install or unlock the extension, then try again.");
    }

    const permission = await isAllowed();
    if (responseError(permission)) {
      return unavailableState(responseError(permission)!);
    }
    if (!permission.isAllowed) {
      const permissionRequest = await setAllowed();
      if (responseError(permissionRequest) || !permissionRequest.isAllowed) {
        return unavailableState(responseError(permissionRequest) ?? "Wallet access was not approved.");
      }
    }

    const address = await getAddress();
    const addressError = responseError(address);
    if (addressError || !address.address) {
      return unavailableState(addressError ?? "Freighter did not return an account address.");
    }
    return { connected: true, publicKey: address.address, error: null };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return unavailableState(msg);
  }
}

export async function signTx(
  xdr: string,
  networkPassphrase: string
): Promise<string> {
  const result = await signTransaction(xdr, { networkPassphrase });
  if (typeof result === "string") return result;
  if (result.error) throw new Error(String(result.error));
  if (!result.signedTxXdr) throw new Error("Freighter did not return a signed transaction.");
  return (result as { signedTxXdr: string }).signedTxXdr;
}
