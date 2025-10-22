import React, { useEffect } from "react";
import { useWallet } from "./hooks/useWallet.js";
import { useEligibility } from "./hooks/useEligibility.js";
import { useClaim } from "./hooks/useClaim.js";
import WalletConnectButton from "./components/WalletConnectButton.jsx";
import ClaimStatus from "./components/ClaimStatus.jsx";
import { getExplorerUrl } from "./utils/formatters.js";
import "./App.css";

import { APP_METADATA } from "./utils/constants.js";

// For SEO (page metadata)
import { CAMPAIGN_ID, SEO_METADATA } from "./utils/constants";
import { useSEO } from "./hooks/useSEO";

function App() {
  useSEO(SEO_METADATA.name, SEO_METADATA.description);

  const {
    wallet,
    isConnecting,
    isConnected,
    address,
    formattedAddress,
    connect,
    disconnect,
    error: walletError,
  } = useWallet();

  const {
    isLoading: isLoadingProof,
    isEligible,
    proof,
    error: eligibilityError,
    statusMessage: proofStatusMessage,
    checkEligibility,
    reset: resetEligibility,
    retry: retryEligibility,
  } = useEligibility(CAMPAIGN_ID);

  const {
    isClaiming,
    txHash,
    hasClaimed,
    error: claimError,
    statusMessage: claimStatusMessage,
    claimCertificate,
    reset: resetClaim,
    retry: retryClaim,
  } = useClaim(CAMPAIGN_ID);

  // Check eligibility when wallet connects
  useEffect(() => {
    if (address && !isEligible && !hasClaimed) {
      checkEligibility(address);
    }
  }, [address, isEligible, hasClaimed, checkEligibility]);

  // Handle wallet connection
  const handleConnect = async () => {
    resetEligibility();
    resetClaim();
    await connect();
  };

  // Handle wallet disconnection
  const handleDisconnect = async () => {
    resetEligibility();
    resetClaim();
    await disconnect();
  };

  // Handle claim
  const handleClaim = async () => {
    if (address && proof) {
      await claimCertificate(address, proof);
    }
  };

  // Handle retry for eligibility
  const handleRetryEligibility = async () => {
    if (address) {
      await retryEligibility(address);
    }
  };

  // Handle retry for claim
  const handleRetryClaim = async () => {
    if (address && proof) {
      await retryClaim(address, proof);
    }
  };

  // Get current error
  const currentError = walletError || eligibilityError || claimError;

  // Get current status message
  const currentStatusMessage = claimStatusMessage || proofStatusMessage;

  return (
    <div className="cosmic-container">
      <div className="stars"></div>
      <div className="stars2"></div>
      <div className="stars3"></div>

      <div className="main-content">
        <header className="header">
          <h1 className="title">
            <span className="title-text">Libertas Alpha</span>
            <span className="title-glow">✨</span>
          </h1>
          <p className="subtitle">Mint your NFT Certificate</p>
        </header>

        <div className="claim-card">
          {!isConnected ? (
            <WalletConnectButton
              isConnecting={isConnecting}
              onClick={handleConnect}
            />
          ) : (
            <div className="connected-section">
              <div className="wallet-info">
                <div className="wallet-address">{formattedAddress}</div>
                <button onClick={handleDisconnect} className="disconnect-btn">
                  Disconnect
                </button>
              </div>

              <ClaimStatus
                isEligible={isEligible}
                isLoadingProof={isLoadingProof}
                isClaiming={isClaiming}
                hasClaimed={hasClaimed}
                txHash={txHash}
                error={currentError}
                statusMessage={currentStatusMessage}
                onClaim={handleClaim}
                onRetry={
                  eligibilityError
                    ? handleRetryEligibility
                    : claimError
                    ? handleRetryClaim
                    : null
                }
                getExplorerUrl={getExplorerUrl}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
