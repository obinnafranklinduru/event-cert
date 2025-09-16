require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pinataSDK = require("@pinata/sdk");

// --- Configuration ---
const CONFIG = {
  imagesDirPath: path.join(__dirname, "..", "assets", "images"),
  pinataApiKey: process.env.PINATA_API_KEY,
  pinataSecretKey: process.env.PINATA_API_SECRET,
};

const IPFS_IMAGE_CID_OUTPUT_DIR = path.join(__dirname, "..", "ipfsCID");
const IPFS_IMAGE_CID_PATH = path.join(
  IPFS_IMAGE_CID_OUTPUT_DIR,
  "imageCID.txt"
);

async function uploadImageFolder() {
  console.log("--- Starting Image Folder Upload ---");

  if (!CONFIG.pinataApiKey || !CONFIG.pinataSecretKey) {
    console.error("Error: Pinata API keys not found in .env file.");
    return;
  }

  const pinata = new pinataSDK(CONFIG.pinataApiKey, CONFIG.pinataSecretKey);

  try {
    console.log("Connecting to Pinata...");
    await pinata.testAuthentication();
    console.log("Pinata connection successful!");

    console.log(`Uploading images from: ${CONFIG.imagesDirPath}`);
    const result = await pinata.pinFromFS(CONFIG.imagesDirPath, {
      pinataMetadata: { name: `EventCert-Images-${Date.now()}` },
    });

    const imageFolderCID = result.IpfsHash;

    if (!fs.existsSync(IPFS_IMAGE_CID_OUTPUT_DIR)) {
      fs.mkdirSync(IPFS_IMAGE_CID_OUTPUT_DIR, { recursive: true });
    }

    fs.writeFileSync(IPFS_IMAGE_CID_PATH, imageFolderCID);
    console.log(`Image IPFS CID saved to: ${IPFS_IMAGE_CID_PATH}`);

    console.log(`\n--- Image Upload Complete! ---`);
    console.log(`Image Folder CID: ${imageFolderCID}`);
  } catch (error) {
    console.error("An error occurred during the image upload process:", error);
  }
}

uploadImageFolder();
