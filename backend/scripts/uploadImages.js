require("dotenv").config();
const fs = require("fs").promises;
const path = require("path");
const pinataSDK = require("@pinata/sdk");

// --- Configuration ---
const CONFIG = {
  imagesDirPath: path.join(__dirname, "..", "assets", "images"),
  pinataApiKey: process.env.PINATA_API_KEY,
  pinataSecretKey: process.env.PINATA_API_SECRET,
  ipfsGateway: process.env.IPFS_GATEWAY || "https://ipfs.io/ipfs",
  maxFileSize: 10 * 1024 * 1024, // 10MB per image
  supportedFormats: new Set([".png", ".jpg", ".jpeg", ".webp", ".svg"]),
  sampleValidation: 5, // Validate only first N images
};

const IPFS_IMAGE_CID_OUTPUT_DIR = path.join(__dirname, "..", "ipfsCID");
const IPFS_IMAGE_CID_PATH = path.join(
  IPFS_IMAGE_CID_OUTPUT_DIR,
  `imageCID.txt`
);

/**
 * Validates images directory structure and content
 * Time: O(n) where n = number of files, Space: O(1) - streams files sequentially
 */
async function validateImagesDirectory() {
  try {
    await fs.access(CONFIG.imagesDirPath);
  } catch {
    throw new Error(`Images directory not found: ${CONFIG.imagesDirPath}`);
  }

  const files = await fs.readdir(CONFIG.imagesDirPath);
  const imageFiles = files.filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return CONFIG.supportedFormats.has(ext);
  });

  if (imageFiles.length === 0) {
    throw new Error(
      `No supported image files found in: ${CONFIG.imagesDirPath}`
    );
  }

  // Sample validation - O(k) where k = sample size
  for (
    let i = 0;
    i < Math.min(CONFIG.sampleValidation, imageFiles.length);
    i++
  ) {
    const filePath = path.join(CONFIG.imagesDirPath, imageFiles[i]);
    const stats = await fs.stat(filePath);

    if (stats.size === 0) {
      throw new Error(`Empty image file: ${imageFiles[i]}`);
    }
    if (stats.size > CONFIG.maxFileSize) {
      throw new Error(
        `Image too large: ${imageFiles[i]} (${stats.size} bytes)`
      );
    }
  }

  return imageFiles.length;
}

/**
 * Calculates directory size for monitoring
 * Time: O(n), Space: O(1) - streams sequentially
 */
async function getDirectorySize(dirPath) {
  const files = await fs.readdir(dirPath);
  let totalSize = 0;

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = await fs.stat(filePath);
    totalSize += stats.size;
  }

  return totalSize;
}

/**
 * Uploads images to IPFS with optimized settings
 * Time: O(1) for setup, O(n) upload depends on Pinata, Space: O(1) - streams folder
 */
async function uploadImagesToIPFS(pinata, fileCount, totalSize) {
  console.log(
    `Uploading ${fileCount} images (${(totalSize / 1024 / 1024).toFixed(
      2
    )} MB)...`
  );

  const result = await pinata.pinFromFS(CONFIG.imagesDirPath, {
    pinataMetadata: {
      name: `EventCert-Images-${Date.now()}`,
      keyvalues: {
        fileCount,
        totalSize,
        timestamp: Date.now(),
        formats: Array.from(CONFIG.supportedFormats).join(","),
      },
    },
    pinataOptions: {
      cidVersion: 1,
      wrapWithDirectory: false, // More efficient for image folders
    },
  });

  return {
    cid: result.IpfsHash,
    url: `${CONFIG.ipfsGateway}/${result.IpfsHash}`,
  };
}

/**
 * Saves CID to file with versioning
 * Time: O(1), Space: O(1)
 */
async function saveCIDToFile(cid) {
  await fs.mkdir(IPFS_IMAGE_CID_OUTPUT_DIR, { recursive: true });
  const content = `${cid}`;
  await fs.writeFile(IPFS_IMAGE_CID_PATH, content);
  return IPFS_IMAGE_CID_PATH;
}

/**
 * Main optimized upload function
 * Overall Time: O(n) worst case, Space: O(1) - minimal memory usage
 */
async function uploadImageFolder() {
  console.log("--- Starting Optimized Image Folder Upload ---");

  const startTime = Date.now();
  let fileCount = 0;
  let totalSize = 0;

  try {
    // Phase 1: Validation - O(n)
    if (!CONFIG.pinataApiKey || !CONFIG.pinataSecretKey) {
      throw new Error("Pinata API keys not found in .env file.");
    }

    fileCount = await validateImagesDirectory();
    totalSize = await getDirectorySize(CONFIG.imagesDirPath);
    console.log(
      `✅ Validated ${fileCount} image files (${(
        totalSize /
        1024 /
        1024
      ).toFixed(2)} MB)`
    );

    // Phase 2: Authentication - O(1)
    const pinata = new pinataSDK(CONFIG.pinataApiKey, CONFIG.pinataSecretKey);

    console.log("Authenticating with Pinata...");
    await pinata.testAuthentication();
    console.log("✅ Pinata authentication successful");

    // Phase 3: Upload - O(n) [Pinata dependent]
    const { cid, url } = await uploadImagesToIPFS(pinata, fileCount, totalSize);

    // Phase 4: Save results - O(1)
    const savedPath = await saveCIDToFile(cid);

    const duration = Date.now() - startTime;
    const speed = totalSize / (duration / 1000) / 1024 / 1024; // MB/s

    console.log(`\n--- Image Upload Complete! ---`);
    console.log(`📁 Files uploaded: ${fileCount}`);
    console.log(`📊 Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`⏱️  Duration: ${duration}ms (${speed.toFixed(2)} MB/s)`);
    console.log(`🔗 IPFS CID: ${cid}`);
    console.log(`🌐 Gateway URL: ${url}`);
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
  uploadImageFolder();
}

module.exports = {
  uploadImageFolder,
  validateImagesDirectory,
  getDirectorySize,
};
