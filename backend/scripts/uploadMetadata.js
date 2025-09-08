require("dotenv").config();
const path = require("path");
const pinataSDK = require("@pinata/sdk");

// --- Configuration ---
const CONFIG = {
  metadataDirPath: path.join(__dirname, "..", "assets", "metadata"),
  pinataApiKey: process.env.PINATA_API_KEY,
  pinataSecretKey: process.env.PINATA_SECRET_KEY,
};

async function uploadMetadataFolder() {
  console.log("--- Starting Metadata Folder Upload ---");

  if (!CONFIG.pinataApiKey || !CONFIG.pinataSecretKey) {
    console.error(" Error: Pinata API keys not found in .env file.");
    return;
  }

  const pinata = new pinataSDK(CONFIG.pinataApiKey, CONFIG.pinataSecretKey);

  try {
    console.log("Connecting to Pinata...");
    await pinata.testAuthentication();
    console.log("Pinata connection successful!");

    console.log(`Uploading metadata from: ${CONFIG.metadataDirPath}`);
    const result = await pinata.pinFromFS(CONFIG.metadataDirPath, {
      pinataMetadata: { name: `EventCert-Metadata-${Date.now()}` },
    });

    const metadataFolderCID = result.IpfsHash;
    console.log(`\n--- Metadata Upload Complete! ---`);
    console.log(`Metadata Folder CID: ${metadataFolderCID}`);
    console.log(`\nThis is the Base URI for your smart contract.`);
    console.log(`Use this value when deploying: ipfs://${metadataFolderCID}/`);
  } catch (error) {
    console.error(
      "An error occurred during the metadata upload process:",
      error
    );
  }
}

uploadMetadataFolder();
