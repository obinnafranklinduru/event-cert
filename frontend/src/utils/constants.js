// Network configurations
export const NETWORKS = {
  BASE_MAINNET: {
    id: "0x2105", // 8453
    name: "Base",
    token: "ETH",
    rpcUrl: "https://mainnet.base.org",
    explorerUrl: "https://basescan.org",
  },
  BASE_SEPOLIA: {
    id: "0x14a33", // 84531
    name: "Base Sepolia",
    token: "ETH",
    rpcUrl: "https://sepolia.base.org",
    explorerUrl: "https://sepolia.basescan.org",
  },
};

// Contract addresses
export const CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS ||
  "0x142b9bCCB616F93b014bD100E4C7D266CC8b7E13";

// API configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// WalletConnect configuration
export const WALLETCONNECT_PROJECT_ID =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ||
  "a2432e1bcd8843a074001ad8dbc51b5f";

// App metadata
export const APP_METADATA = {
  name: "Cosmic Claim DApp",
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="8" fill="url(#gradient)"/><defs><linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#64ffda"/><stop offset="100%" style="stop-color:#7c4dff"/></linearGradient></defs></svg>',
  description: "A dApp for claiming your cosmic tokens.",
  explore: import.meta.env.VITE_DAPP_URL || "http://localhost:5173",
};

// Status polling intervals
export const POLLING_INTERVALS = {
  TRANSACTION_STATUS: 2000, // 2 seconds
  MESSAGE_ROTATION: 2000, // 2 seconds
};
