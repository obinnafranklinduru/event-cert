const { deployedContract, relayerWallet } = require("../config/web3");
const { AppError } = require("../middleware/errorHandler");

// TODO: Refactor error handling to a separate utility module if it grows more complex.
// TODO: info user if the relayer is out of funds.

// A map of known custom error selectors from the smart contract.
// This allows us to provide user-friendly error messages.
const CUSTOM_ERRORS = {
  "0x17fb2066": "NotAuthorizedRelayer",
  "0xddefae28": "AlreadyMinted",
  "0x09bde339": "InvalidProof",
  "0x9cbe2357": "NonTransferable",
  "0x9430a17e": "NonExistentToken",
  "0xd92e233d": "ZeroAddress",
  "0x433528b6": "CampaignNotActive",
  "0x9b35ed3b": "CampaignDoesNotExist",
  "0xfece0678": "InvalidCampaignTimes",
  "0x20f18ff3": "CampaignMustStartInFuture",
  "0x85ac2b99": "EmptyMerkleRoot",
  "0xc279959d": "MintingWindowNotOpen",
  "0x7e31d8a3": "CampaignAlreadyExists",
  "0xb5ae13c8": "ProofTooLong",
  "0xb4fa3fb3": "InvalidInput",
  "0xc24f060d": "CannotModifyStartedCampaign",
  "0x303b682f": "MintLimitReached",
  "0xa7b3eca4": "CampaignDurationTooLong",
  "0x8320b483": "CampaignExpired",
  "0x69207028": "CampaignHasMints",
};

/**
 * Submits the mint transaction to the blockchain for a specific campaign.
 * The smart contract is treated as the single source of truth for all validation.
 *
 * @param {string} attendee The address of the user who will receive the NFT.
 * @param {string | number} campaignId The ID of the campaign to mint from.
 * @param {string[]} merkleProof The Merkle proof for the attendee.
 * @returns {Promise<string>} The transaction hash.
 * @throws {AppError} If the transaction fails for any reason.
 */
async function mintNFT(attendee, campaignId, merkleProof) {
  console.log(`Attempting to mint for campaign #${campaignId}...`);
  console.log(`  - Attendee: ${attendee}`);

  try {
    // We use estimateGas as a dry run. If it fails, the transaction will likely fail.
    // This allows us to catch contract reverts without spending gas.
    await deployedContract.mint.estimateGas(attendee, campaignId, merkleProof, {
      from: relayerWallet.address,
    });

    // If estimateGas succeeds, send the actual transaction.
    const tx = await deployedContract.mint(attendee, campaignId, merkleProof, {
      from: relayerWallet.address,
    });

    console.log(`Transaction successful. Hash: ${tx.hash}`);
    return tx.hash;
  } catch (error) {
    console.error("Error during minting process:", error.message);

    // Improved error handling to decode custom errors
    if (error.code === "CALL_EXCEPTION" && error.data) {
      const errorSelector = error.data.slice(0, 10);
      const errorName = CUSTOM_ERRORS[errorSelector];

      if (errorName === "InvalidProof") {
        throw new AppError(
          "This address is not on the whitelist for this campaign.",
          403
        );
      }
      if (errorName === "AlreadyMinted") {
        throw new AppError(
          "This address has already minted a certificate for this campaign.",
          400
        );
      }
      if (
        errorName === "MintingWindowNotOpen" ||
        errorName === "CampaignExpired"
      ) {
        throw new AppError(
          "The minting window for this campaign is not currently open.",
          403
        );
      }
      if (errorName === "CampaignNotActive") {
        throw new AppError("This campaign is not currently active.", 403);
      }
      if (errorName === "MintLimitReached") {
        throw new AppError(
          "The maximum number of mints for this campaign has been reached.",
          403
        );
      }

      // This will catch your specific error and provide a clear hint
      if (errorName) {
        throw new AppError(
          `Transaction reverted with contract error: ${errorName}. `,
          500
        );
      }
    }

    // Fallback for other unexpected errors
    throw new AppError(
      "An unexpected error occurred during the minting process.",
      500
    );
  }
}

module.exports = mintNFT;
