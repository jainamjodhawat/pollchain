import {
  createContext,
  createElement,
  useState,
  useEffect,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
} from "react";
import { checkWalletConnection, connectWallet } from "../utils/wallet";
import type { WalletState } from "../utils/wallet";

interface WalletContextValue {
  wallet: WalletState;
  loading: boolean;
  connect: () => Promise<WalletState>;
  disconnect: () => void;
  refresh: () => Promise<WalletState>;
}

const WalletContext = createContext<WalletContextValue | null>(null);
const DISCONNECTED_KEY = "pollchain.wallet.explicitly-disconnected";

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    publicKey: null,
    error: null,
  });
  const [loading, setLoading] = useState(true);
  const connectionRequest = useRef<Promise<WalletState> | null>(null);

  const refresh = useCallback(async () => {
    if (sessionStorage.getItem(DISCONNECTED_KEY) === "true") {
      const disconnected = { connected: false, publicKey: null, error: null };
      setWallet(disconnected);
      setLoading(false);
      return disconnected;
    }

    const state = await checkWalletConnection();
    setWallet(state);
    setLoading(false);
    return state;
  }, []);

  useEffect(() => {
    let active = true;
    const restore = async () => {
      const state = await checkWalletConnection();
      if (!active) return;
      if (sessionStorage.getItem(DISCONNECTED_KEY) !== "true") setWallet(state);
      setLoading(false);
    };
    void restore();
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
      if (state.connected) sessionStorage.removeItem(DISCONNECTED_KEY);
      return state;
    } finally {
      connectionRequest.current = null;
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    sessionStorage.setItem(DISCONNECTED_KEY, "true");
    setWallet({ connected: false, publicKey: null, error: null });
  }, []);

  return createElement(
    WalletContext.Provider,
    { value: { wallet, loading, connect, disconnect, refresh } },
    children
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used inside WalletProvider");
  return context;
}
