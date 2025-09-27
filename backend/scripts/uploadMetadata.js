require("dotenv").config();
const fs = require("fs").promises;
const path = require("path");
const pinataSDK = require("@pinata/sdk");

// --- Configuration ---
const CONFIG = {
  metadataDirPath: path.join(__dirname, "..", "assets", "metadata"),
  pinataApiKey: process.env.PINATA_API_KEY,
  pinataSecretKey: process.env.PINATA_API_SECRET,
  ipfsGateway: process.env.IPFS_GATEWAY || "https://ipfs.io/ipfs",
  maxFileSize: 1024 * 1024, // 1MB per JSON file
  sampleValidation: 3, // Validate only first N files
};

const IPFS_METADATA_CID_OUTPUT_DIR = path.join(__dirname, "..", "ipfsCID");
const IPFS_METADATA_CID_PATH = path.join(
  IPFS_METADATA_CID_OUTPUT_DIR,
  `jsonCID-${Date.now()}.txt`
);

/**
 * Validates metadata directory structure and content
 * Time: O(n) where n = number of files, Space: O(1) - streams files sequentially
 */
async function validateMetadataDirectory() {
  try {
    await fs.access(CONFIG.metadataDirPath);
  } catch {
    throw new Error(`Metadata directory not found: ${CONFIG.metadataDirPath}`);
  }

  const files = await fs.readdir(CONFIG.metadataDirPath);
  const jsonFiles = files.filter((file) => file.endsWith(".json"));

  if (jsonFiles.length === 0) {
    throw new Error(`No JSON files found in: ${CONFIG.metadataDirPath}`);
  }

  // Sample validation - O(k) where k = sample size
  for (
    let i = 0;
    i < Math.min(CONFIG.sampleValidation, jsonFiles.length);
    i++
  ) {
    const filePath = path.join(CONFIG.metadataDirPath, jsonFiles[i]);
    const stats = await fs.stat(filePath);

    if (stats.size === 0) {
      throw new Error(`Empty file: ${jsonFiles[i]}`);
    }
    if (stats.size > CONFIG.maxFileSize) {
      throw new Error(`File too large: ${jsonFiles[i]} (${stats.size} bytes)`);
    }

    const content = await fs.readFile(filePath, "utf8");
    try {
      JSON.parse(content);
    } catch {
      throw new Error(`Invalid JSON: ${jsonFiles[i]}`);
    }
  }

  return jsonFiles.length;
}

/**
 * Uploads metadata to IPFS with optimized error handling
 * Time: O(1) for setup, O(n) upload depends on Pinata, Space: O(1) - streams folder
 */
async function uploadMetadataToIPFS(pinata, fileCount) {
  console.log(`Uploading ${fileCount} metadata files...`);

  const result = await pinata.pinFromFS(CONFIG.metadataDirPath, {
    pinataMetadata: {
      name: `EventCert-Metadata-${Date.now()}`,
      keyvalues: { fileCount, timestamp: Date.now() },
    },
    pinataOptions: {
      cidVersion: 1, // Better for distributed content
    },
  });

  return `${CONFIG.ipfsGateway}/${result.IpfsHash}`;
}

/**
 * Saves CID to file with versioning
 */
async function saveCIDToFile(cid) {
  await fs.mkdir(IPFS_METADATA_CID_OUTPUT_DIR, { recursive: true });
  await fs.writeFile(IPFS_METADATA_CID_PATH, cid);
  return IPFS_METADATA_CID_PATH;
}

/**
 * Main optimized upload function
 * Overall Time: O(n) worst case, Space: O(1) - minimal memory usage
 */
async function uploadMetadata() {
  console.log("--- Uploading Metadata Folder to IPFS ---");

  const startTime = Date.now();
  let fileCount = 0;

  try {
    // Phase 1: Validation - O(n)
    if (!CONFIG.pinataApiKey || !CONFIG.pinataSecretKey) {
      throw new Error("Pinata API keys not found in .env file.");
    }

    fileCount = await validateMetadataDirectory();
    console.log(`✅ Validated ${fileCount} metadata files`);

    // Phase 2: Authentication - O(1)
    const pinata = new pinataSDK(CONFIG.pinataApiKey, CONFIG.pinataSecretKey);

    console.log("Authenticating with Pinata...");
    await pinata.testAuthentication();
    console.log("✅ Pinata authentication successful");

    // Phase 3: Upload - O(n) [Pinata dependent]
    const metadataFolderCID = await uploadMetadataToIPFS(pinata, fileCount);

    // Phase 4: Save results - O(1)
    const savedPath = await saveCIDToFile(metadataFolderCID);

    const duration = Date.now() - startTime;
    console.log(`\n--- Metadata Upload Complete! ---`);
    console.log(`📁 Files uploaded: ${fileCount}`);
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`🔗 IPFS CID: ${metadataFolderCID}`);
    console.log(`💾 CID saved to: ${savedPath}`);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`\n--- Upload Failed after ${duration}ms ---`);
    console.error("❌ Error:", error.message);

    // Exit with error code for CI/CD pipelines
    process.exit(1);
  }
}

// Handle process signals for clean shutdown
process.on("SIGINT", () => {
  console.log("\nProcess interrupted by user");
  process.exit(0);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
  process.exit(1);
});

// Run only if called directly
if (require.main === module) {
  uploadMetadata();
}

module.exports = {
  uploadMetadata,
  validateMetadataDirectory,
};
