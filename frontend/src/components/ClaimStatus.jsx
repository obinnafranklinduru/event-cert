import React from "react";
import CosmicLoader from "./CosmicLoader.jsx";

/**
 * Claim status display component
 */
const ClaimStatus = ({
  isEligible,
  isLoadingProof,
  isClaiming,
  hasClaimed,
  txHash,
  error,
  statusMessage,
  onClaim,
  onRetry,
  getExplorerUrl,
  className = "",
}) => {
  if (error) {
    return (
      <div className={`error-section ${className}`}>
        <div className="error-icon">⚠️</div>
        <p className="error-text">{error}</p>
        {onRetry && (
          <button onClick={onRetry} className="retry-btn">
            Try Again
          </button>
        )}
        <style jsx>{`
          .error-section {
            text-align: center;
            padding: 1.5rem 0;
          }

          .error-icon {
            font-size: 2rem;
            margin-bottom: 1rem;
            display: block;
          }

          .error-text {
            color: #ff6b9d;
            margin: 0 0 1rem 0;
          }

          .retry-btn {
            background: rgba(255, 107, 157, 0.1);
            border: 1px solid #ff6b9d;
            color: #ff6b9d;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .retry-btn:hover {
            background: rgba(255, 107, 157, 0.2);
          }
        `}</style>
      </div>
    );
  }

  if (isLoadingProof) {
    return (
      <div className={`status-section ${className}`}>
        <CosmicLoader message={statusMessage} />
        <style jsx>{`
          .status-section {
            text-align: center;
            padding: 2rem 0;
          }
        `}</style>
      </div>
    );
  }

  if (isEligible && !hasClaimed) {
    return (
      <div className={`eligible-section ${className}`}>
        <div className="success-icon">🌟</div>
        <p className="eligible-text">
          Congratulations! You're eligible to claim your cosmic certificate.
        </p>
        <button
          onClick={onClaim}
          disabled={isClaiming}
          className={`claim-btn ${isClaiming ? "claiming" : ""}`}
        >
          {isClaiming ? (
            <>
              <div className="pulse-ring"></div>
              Claiming...
            </>
          ) : (
            "Claim Certificate"
          )}
        </button>

        <style jsx>{`
          .eligible-section {
            text-align: center;
            padding: 1.5rem 0;
          }

          .success-icon {
            font-size: 2rem;
            margin-bottom: 1rem;
            display: block;
          }

          .eligible-text {
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 1.5rem;
          }

          .claim-btn {
            background: linear-gradient(135deg, #ff6b9d, #ffa726);
            border: none;
            color: white;
            padding: 1rem 2rem;
            font-size: 1.1rem;
            font-weight: 600;
            border-radius: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            animation: claim-pulse 2s ease-in-out infinite;
          }

          @keyframes claim-pulse {
            0%,
            100% {
              box-shadow: 0 0 20px rgba(255, 107, 157, 0.3);
            }
            50% {
              box-shadow: 0 0 30px rgba(255, 107, 157, 0.5),
                0 0 50px rgba(255, 107, 157, 0.2);
            }
          }

          .claim-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            animation: none;
            box-shadow: 0 8px 24px rgba(255, 107, 157, 0.5);
          }

          .claim-btn:disabled {
            opacity: 0.8;
            cursor: not-allowed;
          }

          .claim-btn.claiming {
            animation: claiming-pulse 1s ease-in-out infinite;
          }

          @keyframes claiming-pulse {
            0%,
            100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.02);
            }
          }

          .pulse-ring {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 20px;
            height: 20px;
            border: 2px solid white;
            border-radius: 50%;
            animation: pulse-ring-anim 1.5s ease-out infinite;
          }

          @keyframes pulse-ring-anim {
            0% {
              transform: translate(-50%, -50%) scale(0.5);
              opacity: 1;
            }
            100% {
              transform: translate(-50%, -50%) scale(2);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    );
  }

  if (isClaiming) {
    return (
      <div className={`status-section ${className}`}>
        <CosmicLoader variant="claiming" message={statusMessage} />
        <style jsx>{`
          .status-section {
            text-align: center;
            padding: 2rem 0;
          }
        `}</style>
      </div>
    );
  }

  if (txHash && hasClaimed) {
    return (
      <div className={`success-section ${className}`}>
        <div className="confetti">🎉</div>
        <h3 className="success-title">Certificate Claimed!</h3>
        <p className="success-text">
          Your cosmic certificate has been successfully minted and added to your
          wallet.
        </p>
        <a
          href={getExplorerUrl(txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="explorer-link"
        >
          View on Block Explorer
          <span className="link-arrow">→</span>
        </a>

        <style jsx>{`
          .success-section {
            text-align: center;
            padding: 1.5rem 0;
          }

          .confetti {
            font-size: 2rem;
            margin-bottom: 1rem;
            display: block;
          }

          .success-title {
            color: #64ffda;
            margin: 0 0 1rem 0;
            font-size: 1.5rem;
          }

          .success-text {
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 1.5rem;
          }

          .explorer-link {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            color: #64ffda;
            text-decoration: none;
            padding: 0.75rem 1.5rem;
            border: 1px solid #64ffda;
            border-radius: 12px;
            transition: all 0.3s ease;
            font-weight: 500;
          }

          .explorer-link:hover {
            background: rgba(100, 255, 218, 0.1);
            transform: translateY(-1px);
          }

          .link-arrow {
            transition: transform 0.3s ease;
          }

          .explorer-link:hover .link-arrow {
            transform: translateX(4px);
          }
        `}</style>
      </div>
    );
  }

  return null;
};

export default ClaimStatus;
