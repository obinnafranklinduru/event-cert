import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useChainId } from "wagmi";
import { apiService } from "../config/api";
import { getExplorerUrl } from "../config/walletconnect";

console.log("🎯 Minter component loading...");

const LOADING_MESSAGES = [
  "🌟 Waking up the server...",
  "📜 Checking the whitelist scrolls...",
  "🔍 Scanning the blockchain archives...",
  "✨ Preparing your certificate...",
  "🚀 Almost there, hang tight!",
  "⚡ Connecting to the matrix...",
  "🎯 Validating your eligibility...",
  "🔮 Consulting the oracle...",
  "🌈 Creating magic moments...",
  "⭐ Your certificate awaits...",
];

const MINT_MESSAGES = [
  "🔥 Minting your certificate...",
  "⛓️ Writing to the blockchain...",
  "💎 Creating your NFT...",
  "🎊 Finalizing your achievement...",
  "🚀 Broadcasting to the network...",
  "✨ Making it permanent...",
  "🏆 Securing your proof...",
  "🌟 Almost minted...",
  "⚡ Processing transaction...",
  "🎯 Confirming on-chain...",
];

function Minter({ account }) {
  console.log("🎯 Minter rendering with account:", account);

  const [loadingMessage, setLoadingMessage] = useState("");
  const [mintMessage, setMintMessage] = useState("");
  const chainId = useChainId();
  const queryClient = useQueryClient();

  console.log("🌐 Current chain ID:", chainId);

  // Query to fetch Merkle proof
  const proofQuery = useQuery({
    queryKey: ["proof", account],
    queryFn: () => apiService.getProof(account),
    enabled: !!account,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry if user is not eligible (404) or already minted
      if (error?.response?.status === 404) return false;
      if (error?.response?.data?.message?.includes("already minted"))
        return false;
      return failureCount < 3;
    },
  });

  // Mutation for minting
  const mintMutation = useMutation({
    mutationFn: ({ attendee, merkleProof }) =>
      apiService.mint({ attendee, merkleProof }),
    onSuccess: (data) => {
      // Invalidate proof query to refetch data
      queryClient.invalidateQueries({ queryKey: ["proof", account] });
      console.log("✅ Minting successful:", data);
    },
    onError: (error) => {
      console.error("❌ Minting failed:", error);
    },
  });

  // Rotating loading messages for proof query
  useEffect(() => {
    let interval;
    if (proofQuery.isLoading) {
      const updateMessage = () => {
        const randomMessage =
          LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
        setLoadingMessage(randomMessage);
      };

      updateMessage(); // Set initial message
      interval = setInterval(updateMessage, 2500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [proofQuery.isLoading]);

  // Rotating loading messages for mint mutation
  useEffect(() => {
    let interval;
    if (mintMutation.isPending) {
      const updateMessage = () => {
        const randomMessage =
          MINT_MESSAGES[Math.floor(Math.random() * MINT_MESSAGES.length)];
        setMintMessage(randomMessage);
      };

      updateMessage(); // Set initial message
      interval = setInterval(updateMessage, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mintMutation.isPending]);

  const handleMint = () => {
    if (!proofQuery.data?.proof || !account) {
      console.error("Missing proof or account");
      return;
    }

    mintMutation.mutate({
      attendee: account,
      merkleProof: proofQuery.data.proof,
    });
  };

  // Check if user has already minted based on API response
  const hasAlreadyMinted = () => {
    // Check mint mutation error for "already minted" message
    if (mintMutation.isError) {
      const errorMessage = mintMutation.error.response?.data?.message || "";
      return errorMessage.toLowerCase().includes("already minted");
    }

    // Check proof query error for "already minted" message
    if (proofQuery.isError) {
      const errorMessage = proofQuery.error.response?.data?.message || "";
      return errorMessage.toLowerCase().includes("already minted");
    }

    return false;
  };

  const renderContent = () => {
    // Check if user has already minted
    const alreadyMinted = hasAlreadyMinted();

    // Show loading state for proof query
    if (proofQuery.isLoading) {
      return (
        <>
          <div className="status-message status-loading">
            <div className="spinner"></div>
            <span>{loadingMessage}</span>
          </div>
          <button className="btn btn-primary" disabled>
            Checking Eligibility...
          </button>
        </>
      );
    }

    // Show error if proof query failed
    if (proofQuery.isError) {
      const errorMessage =
        proofQuery.error.response?.data?.message ||
        proofQuery.error.message ||
        "You're not eligible for this certificate";

      // Special case for already minted
      if (alreadyMinted) {
        return (
          <>
            <div className="status-message status-success">
              🎉 You've already claimed your certificate!
            </div>
            <div className="status-message status-info">
              Each address can only mint one certificate.
            </div>
          </>
        );
      }

      return (
        <>
          <div className="status-message status-error">❌ {errorMessage}</div>
          <button
            onClick={() => proofQuery.refetch()}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </>
      );
    }

    // Show success - user is eligible
    if (proofQuery.isSuccess) {
      // Show API error message if proof retrieval failed
      if (!proofQuery.data?.success && proofQuery.data?.message) {
        // Check for already minted message
        if (proofQuery.data.message.toLowerCase().includes("already minted")) {
          return (
            <>
              <div className="status-message status-success">
                🎉 You've already claimed your certificate!
              </div>
              <div className="status-message status-info">
                Each address can only mint one certificate.
              </div>
            </>
          );
        }

        return (
          <>
            <div className="status-message status-error">
              ❌ {proofQuery.data.message}
            </div>
            <button
              onClick={() => proofQuery.refetch()}
              className="btn btn-primary"
            >
              Try Again
            </button>
          </>
        );
      }

      // Show minting in progress
      if (mintMutation.isPending) {
        return (
          <>
            <div className="status-message status-loading">
              <div className="spinner"></div>
              <span>{mintMessage}</span>
            </div>
            <button className="btn btn-primary" disabled>
              Minting in Progress...
            </button>
          </>
        );
      }

      // Show mint error with API response message
      if (mintMutation.isError) {
        const errorMessage =
          mintMutation.error.response?.data?.message ||
          mintMutation.error.message ||
          "Minting failed. Please try again.";

        // Special case for already minted
        if (alreadyMinted) {
          return (
            <>
              <div className="status-message status-success">
                🎉 You've already claimed your certificate!
              </div>
              <div className="status-message status-info">
                Each address can only mint one certificate.
              </div>
            </>
          );
        }

        return (
          <>
            <div className="status-message status-success">
              ✅ You're eligible for the certificate!
            </div>
            <div className="status-message status-error">❌ {errorMessage}</div>
            <button onClick={handleMint} className="btn btn-primary">
              Try Minting Again
            </button>
          </>
        );
      }

      // Show successful mint
      if (mintMutation.isSuccess && mintMutation.data?.data?.transactionHash) {
        const explorerUrl = getExplorerUrl(
          mintMutation.data.data.transactionHash,
          chainId
        );
        return (
          <>
            <div className="status-message status-success">
              🎉 Certificate minted successfully!
            </div>
            <div className="status-message status-info">
              <div>
                <strong>Transaction Hash:</strong>
                <br />
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tx-hash"
                >
                  {mintMutation.data.data.transactionHash}
                </a>
              </div>
            </div>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-link"
            >
              View on Block Explorer
            </a>
          </>
        );
      }

      // Show mint button (ready to mint) - but check if already minted first
      if (alreadyMinted) {
        return (
          <>
            <div className="status-message status-success">
              🎉 You've already claimed your certificate!
            </div>
            <div className="status-message status-info">
              Each address can only mint one certificate.
            </div>
          </>
        );
      }

      return (
        <>
          <div className="status-message status-success">
            ✅ Congratulations! You're eligible for the certificate.
          </div>
          <button onClick={handleMint} className="btn btn-primary">
            🏆 Claim Certificate
          </button>
        </>
      );
    }

    // Fallback state
    return (
      <>
        <div className="status-message status-info">
          Ready to check your eligibility...
        </div>
        <button
          onClick={() => proofQuery.refetch()}
          className="btn btn-primary"
        >
          Check Eligibility
        </button>
      </>
    );
  };

  return (
    <div className="minter-container">
      <h2 className="minter-title">Certificate Minter</h2>
      <div className="address">
        <strong>Connected Address:</strong>
        <br />
        {account}
      </div>
      {renderContent()}
    </div>
  );
}

export default Minter;
