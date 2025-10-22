import { useState, useCallback } from "react";
import { apiService } from "../services/api.js";
import { COSMIC_MESSAGES } from "../utils/messages.js";

/**
 * Custom hook for eligibility checking
 */
export const useEligibility = (campaignId) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isEligible, setIsEligible] = useState(false);
  const [proof, setProof] = useState(null);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [messageIndex, setMessageIndex] = useState(0);

  /**
   * Start message rotation
   */
  const startMessageRotation = useCallback(() => {
    const messages = COSMIC_MESSAGES.connecting;
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
   * Check eligibility for an address
   */
  const checkEligibility = useCallback(
    async (address) => {
      if (!address) {
        setError("No address provided");
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        setIsEligible(false);
        setProof(null);

        // Start rotating status messages
        const stopRotation = startMessageRotation();

        try {
          const proofData = await apiService.getProof(address, campaignId);

          setProof(proofData);
          setIsEligible(true);
          setStatusMessage("Eligibility confirmed! ✨");
        } catch (err) {
          setIsEligible(false);

          // Handle specific error cases
          if (
            err.message.includes("not found") ||
            err.message.includes("404")
          ) {
            setError("Address not found in whitelist");
          } else if (err.message.includes("Invalid")) {
            setError("Invalid address format");
          } else {
            setError(err.message || "Failed to check eligibility");
          }
        } finally {
          stopRotation();
        }
      } catch (err) {
        setError(err.message || "Unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    },
    [startMessageRotation]
  );

  /**
   * Reset eligibility state
   */
  const reset = useCallback(() => {
    setIsLoading(false);
    setIsEligible(false);
    setProof(null);
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
   * Retry eligibility check
   */
  const retry = useCallback(
    async (address) => {
      reset();
      await checkEligibility(address);
    },
    [reset, checkEligibility]
  );

  return {
    // State
    isLoading,
    isEligible,
    proof,
    error,
    statusMessage,
    messageIndex,

    // Actions
    checkEligibility,
    reset,
    clearError,
    retry,

    // Computed values
    hasProof: !!proof,
    canRetry: !isLoading && error,
  };
};
