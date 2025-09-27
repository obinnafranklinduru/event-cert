const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const ethers = require("ethers");

// --- CONFIGURATION ---
const CONFIG = {
  csvInputPath: path.join(__dirname, "..", "data", "attendees.csv"),
  merkleOutputDir: path.join(__dirname, "..", "merkleData"),
  walletAddressLength: 42,
};

const MERKLE_ROOT_PATH = path.join(CONFIG.merkleOutputDir, "merkleRoot.txt");
const MERKLE_TREE_PATH = path.join(CONFIG.merkleOutputDir, "merkleTree.json");

/**
 * Validates and normalizes wallet addresses
 */
function validateWalletAddress(address) {
  if (!address || typeof address !== "string") {
    throw new Error("Invalid wallet address: null or undefined");
  }

  const cleanAddress = address.trim();

  if (cleanAddress.length !== CONFIG.walletAddressLength) {
    throw new Error(`Invalid wallet address length: ${cleanAddress}`);
  }

  if (!cleanAddress.startsWith("0x")) {
    throw new Error(`Wallet address must start with 0x: ${cleanAddress}`);
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(cleanAddress)) {
    throw new Error(`Invalid wallet address format: ${cleanAddress}`);
  }

  return cleanAddress;
}

/**
 * Processes CSV data with validation and deduplication
 */
function processCSVData(csvContent) {
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const uniqueAddresses = new Set();
  const validAddresses = [];
  const errors = [];

  records.forEach((record, index) => {
    try {
      if (!record.walletAddress) {
        throw new Error("Missing walletAddress field");
      }

      const validatedAddress = validateWalletAddress(record.walletAddress);

      if (uniqueAddresses.has(validatedAddress.toLowerCase())) {
        throw new Error(`Duplicate wallet address: ${validatedAddress}`);
      }

      uniqueAddresses.add(validatedAddress.toLowerCase());
      validAddresses.push(validatedAddress);
    } catch (error) {
      errors.push(`Row ${index + 1}: ${error.message}`);
    }
  });

  return { validAddresses, errors };
}

/**
 * Generates Merkle leaves from addresses
 */
function generateMerkleLeaves(addresses) {
  return addresses.map((addr) => {
    const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
      ["address"],
      [addr]
    );
    return ethers.keccak256(encoded);
  });
}

/**
 * Builds Merkle tree and generates proofs
 */
function buildMerkleTree(addresses, leaves) {
  const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const merkleRoot = merkleTree.getHexRoot();

  // Generate proofs
  const merkleProofs = {};
  addresses.forEach((addr, index) => {
    const leaf = leaves[index];
    merkleProofs[addr] = merkleTree.getHexProof(leaf);
  });

  return { merkleTree, merkleRoot, merkleProofs };
}

/**
 * Main optimized Merkle tree generation function
 */
async function generateMerkle() {
  console.log("--- Starting Optimized Merkle Tree Generation ---");
  const startTime = Date.now();

  try {
    // Phase 1: Input validation - O(1)
    if (!fs.existsSync(CONFIG.csvInputPath)) {
      throw new Error(`Input file not found at ${CONFIG.csvInputPath}`);
    }

    // Phase 2: Read and process CSV - O(n)
    console.log(`Reading CSV from: ${CONFIG.csvInputPath}`);
    const csvContent = fs.readFileSync(CONFIG.csvInputPath);
    const { validAddresses, errors } = processCSVData(csvContent);

    if (validAddresses.length === 0) {
      throw new Error("No valid wallet addresses found in CSV file");
    }

    console.log(`✅ Processed ${validAddresses.length} unique addresses`);

    if (errors.length > 0) {
      console.warn(`⚠️  ${errors.length} rows had issues:`);
      errors.slice(0, 5).forEach((error) => console.warn(`  ${error}`)); // Show first 5 errors
    }

    // Phase 3: Generate Merkle leaves - O(n)
    console.log("Generating Merkle leaves...");
    const leaves = generateMerkleLeaves(validAddresses);

    // Phase 4: Build Merkle tree - O(n log n)
    console.log("Building Merkle tree...");
    const { merkleRoot, merkleProofs } = buildMerkleTree(
      validAddresses,
      leaves
    );
    console.log(`✅ Merkle Root: ${merkleRoot}`);

    // Phase 5: Save outputs - O(n) for file writing
    console.log("Saving output files...");
    if (!fs.existsSync(CONFIG.merkleOutputDir)) {
      fs.mkdirSync(CONFIG.merkleOutputDir, { recursive: true });
    }

    fs.writeFileSync(MERKLE_ROOT_PATH, merkleRoot);
    fs.writeFileSync(MERKLE_TREE_PATH, JSON.stringify(merkleProofs, null, 2));

    // Phase 6: Report results - O(1)
    const duration = Date.now() - startTime;

    console.log("\n--- Merkle Tree Generation Complete! ---");
    console.log(`📊 Total addresses: ${validAddresses.length}`);
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📁 Merkle root saved to: ${MERKLE_ROOT_PATH}`);
    console.log(`📁 Merkle proofs saved to: ${MERKLE_TREE_PATH}`);

    if (errors.length > 0) {
      console.log(`⚠️  ${errors.length} rows were skipped due to errors`);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`\n--- Generation Failed after ${duration}ms ---`);
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Handle process signals
process.on("SIGINT", () => {
  console.log("\nProcess interrupted by user");
  process.exit(0);
});

// Run only if called directly
if (require.main === module) {
  generateMerkle().catch((error) => {
    console.error("Critical error:", error);
    process.exit(1);
  });
}

module.exports = {
  generateMerkle,
  validateWalletAddress,
  processCSVData,
  generateMerkleLeaves,
};
