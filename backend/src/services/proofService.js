const fs = require("fs");
const path = require("path");
const { AppError } = require("../middleware/errorHandler");

/**
 * Dynamically loads the Merkle tree data for a specific campaign.
 * @param {string | number} campaignId The ID of the campaign.
 * @returns {object} The parsed Merkle tree data for that campaign.
 * @throws {AppError} If the campaign data file is not found.
 */
function loadMerkleTreeForCampaign(campaignId) {
  // Sanitize campaignId to prevent path traversal vulnerabilities
  const safeCampaignId = path.basename(String(campaignId));
  const merkleTreePath = path.join(
    __dirname,
    "..",
    "..",
    "merkleData",
    safeCampaignId,
    "merkleTree.json"
  );

  if (!fs.existsSync(merkleTreePath)) {
    // This is a server-side issue or a request for a non-existent campaign
    throw new AppError(
      `Whitelist for Campaign ID #${safeCampaignId} not found on server`,
      404
    );
  }

  try {
    const fileContent = fs.readFileSync(merkleTreePath, "utf8");
    return JSON.parse(fileContent);
  } catch (error) {
    // Handle JSON parsing errors or other file read issues
    console.error(
      `Failed to read or parse Merkle tree for campaign ${safeCampaignId}:`,
      error
    );
    throw new AppError("Failed to load campaign data", 500);
  }
}

/**
 * Retrieves the Merkle proof for a given address within a specific campaign.
 * @param {string} address The wallet address of the attendee.
 * @param {string | number} campaignId The ID of the campaign to check.
 * @returns {{ proof: string[] } | null} The Merkle proof object, or null if the address is not found.
 */
function getProofForAddress(address, campaignId) {
  if (!address) throw new AppError("Address parameter is required", 400);
  if (!campaignId) throw new AppError("Campaign ID parameter is required", 400);

  const merkleTreeData = loadMerkleTreeForCampaign(campaignId);

  console.log(
    `Loaded Merkle tree for campaign #${campaignId}. Searching for address: ${address}`
  );

  // Addresses in the merkle tree JSON are checksummed.
  // We search for a case-insensitive match to be robust against user input variations.
  const matchingAddress = Object.keys(merkleTreeData).find(
    (key) => key.toLowerCase() === address.toLowerCase()
  );

  console.log("Matching address found:", matchingAddress);

  if (!matchingAddress) return null;

  return { proof: merkleTreeData[matchingAddress] };
}

module.exports = getProofForAddress;
