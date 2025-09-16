import { useState, useEffect } from "react";
import { walletService } from "../services/wallet.js";
import { NETWORKS } from "../utils/constants.js";

/**
 * Custom hook for wallet state management
 */
export const useWallet = () => {
  const [wallet, setWallet] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState("0");
  const [chainId, setChainId] = useState(null);
  const [error, setError] = useState(null);

  // Subscribe to wallet changes
  useEffect(() => {
    let unsubscribe;

    try {
      unsubscribe = walletService.subscribe((wallets) => {
        const primaryWallet = wallets.length > 0 ? wallets[0] : null;

        setWallet(primaryWallet);
        setIsConnected(!!primaryWallet && primaryWallet.accounts.length > 0);
        setAddress(primaryWallet?.accounts[0]?.address || null);
        setChainId(primaryWallet?.chains[0]?.id || null);

        // Update balance when wallet changes
        if (primaryWallet) {
          updateBalance(primaryWallet);
        } else {
          setBalance("0");
        }
      });

      // Check for existing connection on mount
      const existingWallet = walletService.getPrimaryWallet();
      if (existingWallet) {
        setWallet(existingWallet);
        setIsConnected(true);
        setAddress(existingWallet.accounts[0]?.address || null);
        setChainId(existingWallet.chains[0]?.id || null);
        updateBalance(existingWallet);
      }
    } catch (error) {
      console.error("Failed to subscribe to wallet changes:", error);
    }

    // Return cleanup function
    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  /**
   * Update wallet balance
   */
  const updateBalance = async (walletToCheck = wallet) => {
    if (walletToCheck) {
      try {
        const newBalance = await walletService.getBalance(walletToCheck);
        setBalance(newBalance);
      } catch (error) {
        console.error("Failed to update balance:", error);
      }
    }
  };

  /**
   * Connect wallet
   */
  const connect = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      const connectedWallet = await walletService.connect();

      if (connectedWallet) {
        setWallet(connectedWallet);
        setIsConnected(true);
        setAddress(connectedWallet.accounts[0]?.address || null);
        setChainId(connectedWallet.chains[0]?.id || null);
        await updateBalance(connectedWallet);
      }
    } catch (err) {
      setError(err.message);
      console.error("Connection error:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  /**
   * Disconnect wallet
   */
  const disconnect = async () => {
    try {
      if (wallet) {
        await walletService.disconnect(wallet.label);
      }

      setWallet(null);
      setIsConnected(false);
      setAddress(null);
      setBalance("0");
      setChainId(null);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Disconnection error:", err);
    }
  };

  /**
   * Switch to a specific network
   */
  const switchNetwork = async (targetChainId = NETWORKS.BASE_SEPOLIA.id) => {
    try {
      setError(null);
      const success = await walletService.switchNetwork(targetChainId);

      if (!success) {
        setError("Failed to switch network");
      }

      return success;
    } catch (err) {
      setError(err.message);
      console.error("Network switch error:", err);
      return false;
    }
  };

  /**
   * Check if on correct network
   */
  const isOnCorrectNetwork = (requiredChainId = NETWORKS.BASE_SEPOLIA.id) => {
    return walletService.isOnCorrectNetwork(wallet, requiredChainId);
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    setError(null);
  };

  return {
    // State
    wallet,
    isConnecting,
    isConnected,
    address,
    balance,
    chainId,
    error,

    // Actions
    connect,
    disconnect,
    switchNetwork,
    updateBalance,
    clearError,

    // Utilities
    isOnCorrectNetwork,

    // Computed values
    formattedAddress: address
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : "",
    isOnBaseSepolia: chainId === NETWORKS.BASE_SEPOLIA.id,
    isOnBase: chainId === NETWORKS.BASE_MAINNET.id,
  };
};
