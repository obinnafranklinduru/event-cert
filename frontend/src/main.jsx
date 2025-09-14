import React from "react";
import ReactDOM from "react-dom/client";
import { createConfig, http, WagmiProvider } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import App from "./App.jsx";
import "./App.css";

// projectId from https://dashboard.reown.com/
const projectId = "a2432e1bcd8843a074001ad8dbc51b5f";

let config;

try {
  config = createConfig({
    chains: [base, baseSepolia],
    transports: {
      [base.id]: http(),
      [baseSepolia.id]: http(),
    },
  });

  const wagmiAdapter = new WagmiAdapter({
    wagmiConfig: config,
    projectId,
    networks: [base, baseSepolia],
  });

  createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks: [base, baseSepolia],
    defaultNetwork: baseSepolia,
    metadata: {
      name: "Libeta Good Certificate Minter",
      description: "Mint your attendance certificates",
      url: window.location.origin,
      icons: ["https://avatars.githubusercontent.com/u/37784886"],
    },
    features: {
      analytics: false,
      email: false,
      socials: [],
      emailShowWallets: false,
      swaps: false,
      onramp: false,
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
    enableWalletConnect: true,
    enableInjected: true,
    enableCoinbase: true,
    allowUnsupportedChain: false,
  });
} catch (error) {
  console.error("Error setting up wagmi/appkit:", error);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

try {
  const root = ReactDOM.createRoot(document.getElementById("root"));
  console.log("✅ Root element found, rendering app...");

  root.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <App />
        </WagmiProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );

  console.log("App rendered successfully");
} catch (error) {
  console.error("Error rendering app:", error);
}
