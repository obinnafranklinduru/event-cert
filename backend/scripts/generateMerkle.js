const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const ethers = require("ethers");

// Debug: Show current working directory and files
console.log("Current working directory:", process.cwd());
console.log("Script directory:", __dirname);
console.log("Files in script directory:", fs.readdirSync(__dirname));

// --- CONFIGURATION ---
const CSV_INPUT_PATH = path.join(__dirname, "..", "attendees.csv");
const MERKLE_OUTPUT_DIR = path.join(__dirname, "..", "merkleData");
const MERKLE_ROOT_PATH = path.join(MERKLE_OUTPUT_DIR, "merkleRoot.txt");
const MERKLE_TREE_PATH = path.join(MERKLE_OUTPUT_DIR, "merkleTree.json");

/**
 * Main function to generate the Merkle tree and associated files.
 */
async function generateMerkle() {
  console.log("Starting Merkle tree generation...");
  console.log("Looking for CSV file at:", CSV_INPUT_PATH);

  // Debug: Check what files exist in the current directory
  console.log("Files in current directory:", fs.readdirSync(__dirname));

  // 1. Read and parse the CSV file
  if (!fs.existsSync(CSV_INPUT_PATH)) {
    console.error(`Error: Input file not found at ${CSV_INPUT_PATH}`);
    console.error(
      'Please create an attendees.csv file with "name,walletAddress" columns.'
    );
    return;
  }
  const csvContent = fs.readFileSync(CSV_INPUT_PATH);
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  });

  const addresses = records.map((record) => record.walletAddress);
  if (addresses.length === 0) {
    console.error("Error: No wallet addresses found in the CSV file.");
    return;
  }
  console.log(`Found ${addresses.length} attendee addresses.`);

  // 2. Create leaf nodes for the Merkle tree
  // Each leaf is the keccak256 hash of the attendee's address.
  const leaves = addresses.map((addr) => {
    // SINGLE HASHING: Match OpenZeppelin's standard
    const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
      ["address"],
      [addr]
    );
    return ethers.keccak256(encoded);
  });

  // 3. Build the Merkle tree
  const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });

  // 4. Get the Merkle root
  // The root is a 'bytes32' hash, formatted with a '0x' prefix.
  const merkleRoot = merkleTree.getHexRoot();
  console.log(`Merkle Root generated: ${merkleRoot}`);

  // 5. Generate proofs for each address
  // Create a JSON object mapping each address to its corresponding proof.
  const merkleProofs = {};
  addresses.forEach((addr, index) => {
    const leaf = leaves[index];
    const proof = merkleTree.getHexProof(leaf);
    merkleProofs[addr] = proof;
  });

  // 6. Save the output files
  // Ensure the output directory exists.
  if (!fs.existsSync(MERKLE_OUTPUT_DIR)) {
    fs.mkdirSync(MERKLE_OUTPUT_DIR, { recursive: true });
  }

  // Write the Merkle root to a text file.
  fs.writeFileSync(MERKLE_ROOT_PATH, merkleRoot);
  console.log(`Merkle root saved to: ${MERKLE_ROOT_PATH}`);

  // Write the full tree with proofs to a JSON file.
  fs.writeFileSync(MERKLE_TREE_PATH, JSON.stringify(merkleProofs, null, 2));
  console.log(`Merkle tree with proofs saved to: ${MERKLE_TREE_PATH}`);
  console.log("\n Generation complete!");
}

// Execute the script
generateMerkle().catch((error) => {
  console.error("An unexpected error occurred:", error);
  process.exit(1);
});
