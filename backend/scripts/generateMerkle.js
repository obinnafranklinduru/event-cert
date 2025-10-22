const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const { ethers } = require("ethers");

// --- CONFIGURATION ---
const CONFIG = {
  csvInputPath: path.join(__dirname, "..", "data", "attendees.csv"),
  merkleOutputDir: path.join(__dirname, "..", "merkleData"),
  walletAddressLength: 42,
};

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
  console.log("Encoding leaves using abi.encodePacked standard...");
  return addresses.map((addr) => {
    return ethers.solidityPackedKeccak256(["address"], [addr]);
  });
}

/**
 * Builds Merkle tree and generates proofs
 */
function buildMerkleTree(addresses, leaves) {
  const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const merkleRoot = merkleTree.getHexRoot();

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
    // UPDATED: Read campaign ID from command-line arguments
    const campaignId = process.argv[2];
    if (!campaignId || !/^\d+$/.test(campaignId) || Number(campaignId) < 1) {
      throw new Error(
        "Invalid or missing Campaign ID. Please provide a valid number as a command-line argument.\nUsage: node scripts/generate-merkle.js <campaignId>"
      );
    }
    console.log(`Generating Merkle data for Campaign ID: ${campaignId}`);

    // UPDATED: Dynamically create paths based on the campaign ID
    const merkleOutputDir = path.join(CONFIG.merkleOutputDir, campaignId);
    const merkleRootPath = path.join(merkleOutputDir, "merkleRoot.txt");
    const merkleTreePath = path.join(merkleOutputDir, "merkleTree.json");

    // Phase 1: Input validation
    if (!fs.existsSync(CONFIG.csvInputPath)) {
      throw new Error(`Input file not found at ${CONFIG.csvInputPath}`);
    }

    // Phase 2: Read and process CSV
    const csvContent = fs.readFileSync(CONFIG.csvInputPath);
    const { validAddresses, errors } = processCSVData(csvContent);

    if (validAddresses.length === 0) {
      throw new Error("No valid wallet addresses found in CSV file");
    }

    console.log(`✅ Processed ${validAddresses.length} unique addresses`);
    if (errors.length > 0) {
      console.warn(`⚠️  ${errors.length} rows had issues:`);
      errors.slice(0, 5).forEach((error) => console.warn(`  ${error}`));
    }

    // Phase 3: Generate Merkle leaves
    const leaves = generateMerkleLeaves(validAddresses);

    // Phase 4: Build Merkle tree
    const { merkleRoot, merkleProofs } = buildMerkleTree(
      validAddresses,
      leaves
    );
    console.log(`✅ Merkle Root: ${merkleRoot}`);

    // Phase 5: Save outputs
    if (!fs.existsSync(merkleOutputDir)) {
      fs.mkdirSync(merkleOutputDir, { recursive: true });
    }

    fs.writeFileSync(merkleRootPath, merkleRoot);
    fs.writeFileSync(merkleTreePath, JSON.stringify(merkleProofs, null, 2));

    // Phase 6: Report results
    const duration = Date.now() - startTime;
    console.log("\n--- Merkle Tree Generation Complete! ---");
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📁 Merkle root saved to: ${merkleRootPath}`);
    console.log(`📁 Merkle proofs saved to: ${merkleTreePath}`);
  } catch (error) {
    console.error("\n--- Generation Failed ---");
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

generateMerkle();

module.exports = {
  generateMerkle,
  validateWalletAddress,
  processCSVData,
  generateMerkleLeaves,
};
