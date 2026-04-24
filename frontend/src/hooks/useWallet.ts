import { useState, useEffect, useCallback } from "react";
import { checkWalletConnection, connectWallet } from "../utils/wallet";
import type { WalletState } from "../utils/wallet";

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    publicKey: null,
    error: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkWalletConnection().then((state) => {
      setWallet(state);
      setLoading(false);
    });
  }, []);

  const connect = useCallback(async () => {
    setLoading(true);
    const state = await connectWallet();
    setWallet(state);
    setLoading(false);
    return state;
  }, []);

  const disconnect = useCallback(() => {
    setWallet({ connected: false, publicKey: null, error: null });
  }, []);

  return { wallet, loading, connect, disconnect };
}
