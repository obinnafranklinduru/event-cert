import React from "react";
import { useAccount } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import Minter from "./components/Minter";

console.log("📱 App.jsx loading...");

function App() {
  console.log("🔄 App component rendering...");

  // Hooks must be called at the top level - never inside conditions
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();

  console.log("👛 Wallet state:", { address, isConnected });

  const handleConnect = () => {
    console.log("🔗 Connect button clicked");
    try {
      open();
    } catch (error) {
      console.error("❌ Error opening wallet modal:", error);
    }
  };

  // Handle any rendering errors
  try {
    return (
      <div className="app">
        <header className="header">
          <h1>libeta Good</h1>
          {!isConnected ? (
            <button onClick={handleConnect} className="btn btn-primary">
              Connect Wallet
            </button>
          ) : (
            <div className="address">
              Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
          )}
        </header>

        <main className="main-content">
          {!isConnected ? (
            <div className="minter-container">
              <h2 className="minter-title">Welcome to Certificate Minting</h2>
              <p className="status-message status-info">
                Connect your wallet to check your eligibility and mint your
                attendance certificate.
              </p>
              <button onClick={handleConnect} className="btn btn-primary">
                Connect Wallet to Get Started
              </button>
            </div>
          ) : (
            <Minter account={address} />
          )}
        </main>

        <footer className="footer">
          <p>
            &copy; 2024 Libeta Good. Secure certificate minting on the
            blockchain.
          </p>
        </footer>
      </div>
    );
  } catch (error) {
    console.error("❌ Error rendering App component:", error);
    return (
      <div style={{ padding: "20px", color: "white", background: "#1e1144" }}>
        <h1>Error Loading App</h1>
        <p>Check the console for details. Error: {error.message}</p>
      </div>
    );
  }
}

export default App;
