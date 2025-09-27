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
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://libertasalpha-event-cert-api.onrender.com";

// WalletConnect configuration
export const WALLETCONNECT_PROJECT_ID =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ||
  "a2432e1bcd8843a074001ad8dbc51b5f";

// Web3-Onboard specific metadata (limited to supported fields)
export const APP_METADATA = {
  name: "Libertas Alpha - Blockchain Solutions",
  description:
    "We provide cutting-edge solutions in blockchain development, personnel training, and financial analytics to help businesses thrive in the digital age.",
  logo: "/logo.png",
};

// SEO metadata (for React app - separate from Web3-Onboard)
export const SEO_METADATA = {
  name: "Libertas Alpha - Blockchain Solutions",
  description:
    "We provide cutting-edge solutions in blockchain development, personnel training, and financial analytics to help businesses thrive in the digital age.",
  keywords: [
    "blockchain development",
    "personnel training",
    "financial analytics",
    "business solutions",
    "digital transformation",
    "web3 consulting",
    "blockchain education",
    "Libertas Alpha",
  ],
  social: {
    twitter: "@LibertasAlpha",
    facebook: "libertas.alpha",
    linkedin: "company/libertas-alpha",
    instagram: "libertasalpha",
    github: "LibertasAlpha",
    telegram: "libertasalpha",
    discord: "invite/libertasalpha",
    youtube: "@LibertasAlpha",
  },
  socialUrls: {
    twitter: "https://x.com/LibertasAlpha",
    facebook: "https://web.facebook.com/libertas.alpha",
    linkedin: "https://www.linkedin.com/company/libertas-alpha",
    instagram: "https://www.instagram.com/libertasalpha",
    github: "https://github.com/LibertasAlpha",
    telegram: "https://t.me/libertasalpha",
    discord: "https://discord.gg/libertasalpha",
    youtube: "https://youtube.com/@libertasalpha",
  },
  ogImage: "https://www.libertasalpha.com/logo.png",
  ogImageAlt: "Libertas Alpha - Blockchain Development, Training & Analytics",
  company: {
    name: "Libertas Alpha",
    website: "https://www.libertasalpha.com/",
    email: "libertasalpha@gmail.com",
    phone: "+2347065779669",
    address: {
      city: "Owerri",
      country: "Nigeria",
    },
  },
  explore:
    import.meta.env.VITE_DAPP_URL ||
    "https://event-cert-641vxlrxt-duruobinnafranklingmailcoms-projects.vercel.app",
};

// Status polling intervals
export const POLLING_INTERVALS = {
  TRANSACTION_STATUS: 2000, // 2 seconds
  MESSAGE_ROTATION: 2000, // 2 seconds
};
