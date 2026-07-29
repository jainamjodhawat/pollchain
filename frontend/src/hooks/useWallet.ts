import { useState, useEffect, useCallback, useRef } from "react";
import { checkWalletConnection, connectWallet } from "../utils/wallet";
import type { WalletState } from "../utils/wallet";

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    publicKey: null,
    error: null,
  });
  const [loading, setLoading] = useState(true);
  const connectionRequest = useRef<Promise<WalletState> | null>(null);

  useEffect(() => {
    let active = true;
    checkWalletConnection().then((state) => {
      if (!active) return;
      setWallet(state);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const connect = useCallback(async () => {
    if (connectionRequest.current) return connectionRequest.current;
    setLoading(true);
    const request = connectWallet();
    connectionRequest.current = request;
    try {
      const state = await request;
      setWallet(state);
      return state;
    } finally {
      connectionRequest.current = null;
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet({ connected: false, publicKey: null, error: null });
  }, []);

  return { wallet, loading, connect, disconnect };
}
