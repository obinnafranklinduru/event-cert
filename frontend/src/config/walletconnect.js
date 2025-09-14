// WalletConnect and Reown AppKit configuration constants
export const WALLET_CONFIG = {
  projectId: "a2432e1bcd8843a074001ad8dbc51b5f", // Your actual project ID

  metadata: {
    name: "Libeta Good Certificate Minter",
    description: "Mint your attendance certificates on the blockchain",
    url:
      typeof window !== "undefined"
        ? window.location.origin
        : "https://libeta.com",
    icons: ["https://avatars.githubusercontent.com/u/37784886"],
  },

  features: {
    analytics: false,
    email: false,
    socials: [],
    emailShowWallets: false,
  },

  themeMode: "dark",

  themeVariables: {
    "--w3m-font-family":
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    "--w3m-accent": "#bb86fc",
    "--w3m-color-mix": "#1e1144",
    "--w3m-color-mix-strength": 20,
    "--w3m-border-radius-master": "8px",
  },
};

// Network configurations
export const SUPPORTED_CHAINS = {
  BASE: 8453,
  BASE_SEPOLIA: 84532,
};

// Explorer URLs for different chains
export const EXPLORER_URLS = {
  [SUPPORTED_CHAINS.BASE]: "https://basescan.org",
  [SUPPORTED_CHAINS.BASE_SEPOLIA]: "https://sepolia.basescan.org",
};

// Get explorer URL for transaction
export const getExplorerUrl = (
  txHash,
  chainId = SUPPORTED_CHAINS.BASE_SEPOLIA
) => {
  const baseUrl =
    EXPLORER_URLS[chainId] || EXPLORER_URLS[SUPPORTED_CHAINS.BASE_SEPOLIA];
  return `${baseUrl}/tx/${txHash}`;
};

// Utility function to truncate address for display
export const truncateAddress = (address, startChars = 6, endChars = 4) => {
  if (!address) return "";
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};
