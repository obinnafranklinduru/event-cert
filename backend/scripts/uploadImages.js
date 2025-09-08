require("dotenv").config();
const path = require("path");
const pinataSDK = require("@pinata/sdk");

// --- Configuration ---
const CONFIG = {
  imagesDirPath: path.join(__dirname, "..", "assets", "images"),
  pinataApiKey: process.env.PINATA_API_KEY,
  pinataSecretKey: process.env.PINATA_SECRET_KEY,
};

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
    console.log(`\n--- Image Upload Complete! ---`);
    console.log(`Image Folder CID: ${imageFolderCID}`);
    console.log(`\nIMPORTANT: Copy this CID and add it to your .env file as:`);
    console.log(`IMAGE_FOLDER_CID=${imageFolderCID}`);
    console.log("\nThen, run the `generateMetadata.js` script.");
  } catch (error) {
    console.error("An error occurred during the image upload process:", error);
  }
}

uploadImageFolder();
