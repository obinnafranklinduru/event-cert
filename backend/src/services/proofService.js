const fs = require("fs");
const path = require("path");

// --- Merkle Tree Data Loading ---
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
    console.log(
      `Merkle tree data loaded successfully from ${MERKLE_TREE_PATH}`
    );
  } else {
    console.warn(
      `Warning: Merkle tree file not found at ${MERKLE_TREE_PATH}. The /get-proof endpoint will not work.`
    );
    console.warn("Run `npm run generate-merkle` to create it.");
  }
} catch (error) {
  console.error(`Failed to load or parse Merkle tree data:`, error);
  process.exit(1);
}

/**
 * Retrieves the Merkle proof for a given address.
 * @param {string} address The wallet address of the attendee.
 * @returns {string[] | null} The Merkle proof as an array of hex strings, or null if the address is not found.
 */
function getProofForAddress(address) {
  // Addresses in the merkle tree are case-sensitive, but wallet addresses can vary.
  // We search for a case-insensitive match to be robust.
  const matchingAddress = Object.keys(merkleTreeData).find(
    (key) => key.toLowerCase() === address.toLowerCase()
  );

  if (matchingAddress) {
    return merkleTreeData[matchingAddress];
  }
  return null;
}

module.exports = {
  getProofForAddress,
};
