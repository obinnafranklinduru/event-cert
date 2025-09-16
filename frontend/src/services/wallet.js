import Onboard from "@web3-onboard/core";
import injectedModule from "@web3-onboard/injected-wallets";
import walletConnectModule from "@web3-onboard/walletconnect";
import {
  NETWORKS,
  WALLETCONNECT_PROJECT_ID,
  APP_METADATA,
} from "../utils/constants.js";

/**
 * Wallet connection service using Web3-Onboard
 */
class WalletService {
  constructor() {
    this.onboard = null;
    this.wallets = [];
    this.init();
  }

  /**
   * Initialize Web3-Onboard
   */
  init() {
    try {
      const injected = injectedModule();

      const walletConnect = walletConnectModule({
        projectId: WALLETCONNECT_PROJECT_ID,
        requiredChains: [8453], // Base Mainnet
        optionalChains: [84531], // Base Sepolia
        dappUrl: APP_METADATA.url,
      });

      this.onboard = Onboard({
        wallets: [injected, walletConnect],
        chains: [
          {
            id: NETWORKS.BASE_MAINNET.id,
            token: NETWORKS.BASE_MAINNET.token,
            label: NETWORKS.BASE_MAINNET.name,
            rpcUrl: NETWORKS.BASE_MAINNET.rpcUrl,
          },
          {
            id: NETWORKS.BASE_SEPOLIA.id,
            token: NETWORKS.BASE_SEPOLIA.token,
            label: NETWORKS.BASE_SEPOLIA.name,
            rpcUrl: NETWORKS.BASE_SEPOLIA.rpcUrl,
          },
        ],
        appMetadata: APP_METADATA,
        connect: {
          autoConnectLastWallet: true,
          autoConnectAllPreviousWallet: false,
        },
      });

      // Subscribe to wallet updates
      const walletSubscription = this.onboard.state
        .select("wallets")
        .subscribe((wallets) => {
          this.wallets = wallets;
        });

      // Store subscription for cleanup
      this._walletSubscription = walletSubscription;
    } catch (error) {
      console.error("Failed to initialize Web3-Onboard:", error);
      this.onboard = null;
    }
  }

  /**
   * Connect wallet
   * @returns {Promise<Object|null>} Connected wallet or null
   */
  async connect() {
    try {
      const wallets = await this.onboard.connectWallet();
      return wallets.length > 0 ? wallets[0] : null;
    } catch (error) {
      console.error("Wallet connection error:", error);
      throw new Error("Failed to connect wallet");
    }
  }

  /**
   * Disconnect wallet
   * @param {string} walletLabel - Label of wallet to disconnect
   */
  async disconnect(walletLabel) {
    try {
      if (walletLabel) {
        await this.onboard.disconnectWallet({ label: walletLabel });
      } else {
        // Disconnect all wallets
        const connectedWallets = this.getConnectedWallets();
        for (const wallet of connectedWallets) {
          await this.onboard.disconnectWallet({ label: wallet.label });
        }
      }
    } catch (error) {
      console.error("Wallet disconnection error:", error);
    }
  }

  /**
   * Get currently connected wallets
   * @returns {Array} Array of connected wallets
   */
  getConnectedWallets() {
    return this.wallets.filter((wallet) => wallet.accounts.length > 0);
  }

  /**
   * Get primary connected wallet
   * @returns {Object|null} Primary wallet or null
   */
  getPrimaryWallet() {
    const connectedWallets = this.getConnectedWallets();
    return connectedWallets.length > 0 ? connectedWallets[0] : null;
  }

  /**
   * Switch to a specific network
   * @param {string} chainId - Target chain ID (hex)
   * @returns {Promise<boolean>} True if successful
   */
  async switchNetwork(chainId) {
    try {
      const success = await this.onboard.setChain({ chainId });
      return success;
    } catch (error) {
      console.error("Network switch error:", error);
      return false;
    }
  }

  /**
   * Check if wallet is on correct network
   * @param {Object} wallet - Wallet object
   * @param {string} requiredChainId - Required chain ID
   * @returns {boolean} True if on correct network
   */
  isOnCorrectNetwork(wallet, requiredChainId = NETWORKS.BASE_SEPOLIA.id) {
    if (!wallet || !wallet.chains || wallet.chains.length === 0) {
      return false;
    }

    return wallet.chains[0].id === requiredChainId;
  }

  /**
   * Get wallet balance
   * @param {Object} wallet - Wallet object
   * @returns {Promise<string>} Balance in ETH
   */
  async getBalance(wallet) {
    try {
      if (!wallet || !wallet.provider) return "0";

      const balance = await wallet.provider.request({
        method: "eth_getBalance",
        params: [wallet.accounts[0].address, "latest"],
      });

      // Convert from wei to ETH (simplified)
      const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18);
      return balanceInEth.toFixed(4);
    } catch (error) {
      console.error("Balance fetch error:", error);
      return "0";
    }
  }

  /**
   * Subscribe to wallet state changes
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    if (!this.onboard) {
      console.warn("Web3-Onboard not initialized");
      return () => {}; // Return empty function for cleanup
    }

    try {
      const subscription = this.onboard.state
        .select("wallets")
        .subscribe(callback);

      // Return proper unsubscribe function
      return () => {
        if (subscription && typeof subscription.unsubscribe === "function") {
          subscription.unsubscribe();
        }
      };
    } catch (error) {
      console.error("Failed to subscribe to wallet changes:", error);
      return () => {}; // Return empty function for cleanup
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (
      this._walletSubscription &&
      typeof this._walletSubscription.unsubscribe === "function"
    ) {
      this._walletSubscription.unsubscribe();
    }
    this.onboard = null;
    this.wallets = [];
  }
}

// Create and export singleton instance
export const walletService = new WalletService();
export default walletService;
