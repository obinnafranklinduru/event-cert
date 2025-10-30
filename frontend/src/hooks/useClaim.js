import { useState, useCallback } from "react";
import { apiService } from "../services/api.js";
import { COSMIC_MESSAGES } from "../utils/messages.js";

/**
 * Custom hook for certificate claiming
 */
export const useClaim = (campaignId) => {
  const [isClaiming, setIsClaiming] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [messageIndex, setMessageIndex] = useState(0);

  /**
   * Start message rotation for claiming process
   */
  const startClaimingMessages = useCallback(() => {
    const messages = COSMIC_MESSAGES.minting;
    let index = 0;

    const updateMessage = () => {
      setStatusMessage(messages[index % messages.length]);
      setMessageIndex(index);
      index++;
    };

    updateMessage(); // Set initial message
    const interval = setInterval(updateMessage, 2000);

    // Return cleanup function
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  /**
   * Claim certificate
   */
  const claimCertificate = useCallback(
    async (address, merkleProof) => {
      if (!address || !merkleProof) {
        setError("Missing address or proof");
        return;
      }

      try {
        setIsClaiming(true);
        setError(null);
        setTxHash(null);

        // Start rotating status messages
        const stopRotation = startClaimingMessages();

        try {
          const transactionHash = await apiService.mintCertificate(
            address,
            campaignId,
            merkleProof
          );

          setTxHash(transactionHash);
          setHasClaimed(true);
          setStatusMessage(COSMIC_MESSAGES.success[0]);

          return transactionHash;
        } catch (err) {
          // Handle specific error cases
          if (
            err.message.includes("already minted") ||
            err.message.includes("AlreadyMinted")
          ) {
            console.log(
              "Already minted. Fetching existing transaction from DB..."
            );
            setStatusMessage(
              "Already claimed. Fetching existing transaction from DB..."
            );

            try {
              // Call the new API endpoint
              const existingHash = await apiService.getMintTransaction(
                address,
                campaignId
              );

              // Set state to show the success screen
              setTxHash(existingHash);
              setHasClaimed(true);
              setStatusMessage(COSMIC_MESSAGES.success[0]);
            } catch (findErr) {
              // Handle the edge case where the DB lookup fails
              console.error("Failed to find existing mint:", findErr);
              setError(
                "You've already minted, but we couldn't find your original transaction. Please contact support."
              );
              setHasClaimed(true); // Still set this to stop retry attempts
            }
          } else if (
            err.message.includes("Invalid proof") ||
            err.message.includes("InvalidProof")
          ) {
            setError("Invalid eligibility proof");
          } else if (
            err.message.includes("not active") ||
            err.message.includes("MintingNotActive")
          ) {
            setError("Claiming is not currently active");
          } else if (err.message.includes("user rejected")) {
            setError("Transaction cancelled by user");
          } else {
            setError(err.message || "Failed to claim certificate");
          }
        } finally {
          stopRotation();
        }
      } catch (err) {
        setError(err.message || "Unexpected error occurred");
      } finally {
        setIsClaiming(false);
      }
    },
    [startClaimingMessages, campaignId]
  );

  /**
   * Reset claim state
   */
  const reset = useCallback(() => {
    setIsClaiming(false);
    setTxHash(null);
    setHasClaimed(false);
    setError(null);
    setStatusMessage("");
    setMessageIndex(0);
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Retry claim
   */
  const retry = useCallback(
    async (address, merkleProof) => {
      clearError();
      return await claimCertificate(address, merkleProof);
    },
    [claimCertificate, clearError]
  );

  return {
    // State
    isClaiming,
    txHash,
    hasClaimed,
    error,
    statusMessage,
    messageIndex,

    // Actions
    claimCertificate,
    reset,
    clearError,
    retry,

    // Computed values
    canRetry: !isClaiming && error && !hasClaimed,
    isComplete: hasClaimed && txHash,
  };
};
