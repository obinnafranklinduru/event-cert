import React from "react";

/**
 * Wallet connection button component
 */
const WalletConnectButton = ({ isConnecting, onClick, className = "" }) => {
  return (
    <div className={`wallet-connect-section ${className}`}>
      <button
        onClick={onClick}
        disabled={isConnecting}
        className={`connect-btn ${isConnecting ? "loading" : ""}`}
      >
        {isConnecting ? (
          <>
            <div className="spinner"></div>
            Connecting...
          </>
        ) : (
          "Connect Wallet"
        )}
      </button>
      <p className="connect-desc">
        Connect your wallet to begin your cosmic journey
      </p>

      <style jsx>{`
        .wallet-connect-section {
          text-align: center;
        }

        .connect-btn {
          background: linear-gradient(135deg, #7c4dff, #64ffda);
          border: none;
          color: white;
          padding: 1rem 2rem;
          font-size: 1.1rem;
          font-weight: 600;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin: 0 auto 1.5rem auto;
          min-width: 180px;
        }

        .connect-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(124, 77, 255, 0.4);
        }

        .connect-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .connect-desc {
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
          font-size: 0.95rem;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default WalletConnectButton;
