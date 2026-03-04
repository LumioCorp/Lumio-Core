"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { fetchUsdcBalance } from "@/lib/fetchUsdcBalance";

interface WalletContextValue {
  address: string | null;
  displayAddress: string;
  usdcBalance: number;
  isConnected: boolean;
  isLoading: boolean;
  connect: () => Promise<string | null>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  signTransaction: (xdr: string) => Promise<string>;
}

const WalletContext = createContext<WalletContextValue>({
  address: null,
  displayAddress: "",
  usdcBalance: 0,
  isConnected: false,
  isLoading: false,
  connect: async () => null,
  disconnect: () => {},
  refreshBalance: async () => {},
  signTransaction: async () => "",
});

export function useWallet() {
  return useContext(WalletContext);
}

const SESSION_KEY = "lumio_wallet_address";

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [usdcBalance, setUsdcBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const refreshBalance = useCallback(async (addr?: string) => {
    const target = addr ?? address;
    if (!target) return;
    try {
      const balance = await fetchUsdcBalance(target);
      setUsdcBalance(balance);
    } catch {
      setUsdcBalance(0);
    }
  }, [address]);

  // Restore session on mount
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      setAddress(saved);
      refreshBalance(saved);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const connect = useCallback(async (): Promise<string | null> => {
    setIsLoading(true);
    try {
      const { StellarWalletsKit, Networks } = await import(
        "@creit.tech/stellar-wallets-kit"
      );
      const { FreighterModule } = await import(
        "@creit.tech/stellar-wallets-kit/modules/freighter"
      );
      const { xBullModule } = await import(
        "@creit.tech/stellar-wallets-kit/modules/xbull"
      );
      const { AlbedoModule } = await import(
        "@creit.tech/stellar-wallets-kit/modules/albedo"
      );
      const { LobstrModule } = await import(
        "@creit.tech/stellar-wallets-kit/modules/lobstr"
      );

      StellarWalletsKit.init({
        network: Networks.TESTNET,
        modules: [
          new FreighterModule(),
          new xBullModule(),
          new AlbedoModule(),
          new LobstrModule(),
        ],
      });

      const { address: addr } = await StellarWalletsKit.authModal();

      setAddress(addr);
      sessionStorage.setItem(SESSION_KEY, addr);
      await refreshBalance(addr);
      return addr;
    } catch {
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [refreshBalance]);

  const signTransaction = useCallback(async (xdr: string): Promise<string> => {
    const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit");
    const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr);
    return signedTxXdr;
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setUsdcBalance(0);
    sessionStorage.removeItem(SESSION_KEY);
    import("@creit.tech/stellar-wallets-kit").then(({ StellarWalletsKit }) => {
      StellarWalletsKit.disconnect().catch(() => {});
    });
  }, []);

  return (
    <WalletContext.Provider
      value={{
        address,
        displayAddress: address ? truncateAddress(address) : "",
        usdcBalance,
        isConnected: !!address,
        isLoading,
        connect,
        disconnect,
        refreshBalance,
        signTransaction,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
