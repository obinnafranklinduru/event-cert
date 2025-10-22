const { deployedContract } = require("../config/web3");
const { AppError } = require("../middleware/errorHandler");

/**
 * Fetches public details for a specific campaign directly from the smart contract.
 * @param {string} campaignId The ID of the campaign to fetch.
 * @returns {Promise<object|null>} A formatted object with campaign details, or null if not found.
 */
async function getCampaignDetails(campaignId) {
  try {
    // Call the public `getCampaign` view function on the smart contract
    const campaignData = await deployedContract.getCampaign(campaignId);

    // The contract returns default values for a non-existent campaign.
    // A zero Merkle root is a reliable indicator that the campaign has not been created.
    if (
      !campaignData ||
      campaignData.merkleRoot ===
        "0x0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      return null; // Return null to indicate the campaign was not found.
    }

    // Format the data from the contract (which returns BigInts) into a user-friendly JSON object.
    const formattedCampaign = {
      merkleRoot: campaignData.merkleRoot,
      startTime: Number(campaignData.startTime), // Convert BigInt to Number
      endTime: Number(campaignData.endTime), // Convert BigInt to Number
      maxMints: Number(campaignData.maxMints), // Convert BigInt to Number
      isActive: campaignData.isActive,
    };

    return formattedCampaign;
  } catch (error) {
    console.error(
      `Error fetching details for campaign ${campaignId}:`,
      error.message
    );
    // Propagate a generic error to the controller to handle.
    throw new AppError(
      "Failed to retrieve campaign details from the blockchain",
      500
    );
  }
}

module.exports = getCampaignDetails;
