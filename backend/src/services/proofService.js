const fs = require("fs");
const path = require("path");
const { AppError } = require("../middleware/errorHandler");

const MERKLE_TREE_PATH = path.join(
  __dirname,
  "..",
  "..",
  "merkleData",
  "merkleTree.json"
);

let merkleTreeData = {};

try {
  if (fs.existsSync(MERKLE_TREE_PATH)) {
    const fileContent = fs.readFileSync(MERKLE_TREE_PATH, "utf8");
    merkleTreeData = JSON.parse(fileContent);
  } else {
    throw new AppError("Merkle tree data file not found", 500);
  }
} catch (error) {
  throw new AppError(error.message, 500);
}

/**
 * Retrieves the Merkle proof for a given address.
 * @param {string} address The wallet address of the attendee.
 * @returns {string[] | null} The Merkle proof as an array of hex strings, or null if the address is not found.
 */
function getProofForAddress(address) {
  try {
    if (!address) throw new AppError("Address parameter is required", 400);

    // Addresses in the merkle tree are case-sensitive, but wallet addresses can vary.
    // We search for a case-insensitive match to be robust.
    const matchingAddress = Object.keys(merkleTreeData).find(
      (key) => key.toLowerCase() === address.toLowerCase()
    );

    return matchingAddress ? merkleTreeData[matchingAddress] : null;
  } catch (error) {
    throw new AppError(error.message, 500);
  }
}

module.exports = getProofForAddress;
