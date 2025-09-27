import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: [
      "event-cert-641vxlrxt-duruobinnafranklingmailcoms-projects.vercel.app",
      "localhost",
      "127.0.0.1",
    ],
    proxy: {
      "/api": {
        target: "https://libertasalpha-event-cert-api.onrender.com", // Updated to your Render backend
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ""), // Remove /api prefix when proxying
      },
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          web3: [
            "@web3-onboard/core",
            "@web3-onboard/injected-wallets",
            "@web3-onboard/walletconnect",
          ],
        },
      },
    },
  },
  define: {
    global: "globalThis",
  },
  optimizeDeps: {
    include: [
      "@web3-onboard/core",
      "@web3-onboard/injected-wallets",
      "@web3-onboard/walletconnect",
    ],
  },
  // Add base URL for production deployment
  base: process.env.NODE_ENV === "production" ? "/" : "/",
});
