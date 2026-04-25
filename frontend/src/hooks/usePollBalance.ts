import { useState, useEffect } from "react";
import { fetchTokenBalance } from "../utils/contracts";

export function usePollBalance(publicKey: string | null) {
  const [balance, setBalance] = useState<bigint>(0n);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!publicKey) {
      setBalance(0n);
      return;
    }
    setLoading(true);
    fetchTokenBalance(publicKey)
      .then(setBalance)
      .catch(() => setBalance(0n))
      .finally(() => setLoading(false));
  }, [publicKey]);

  return { balance, loading };
}
