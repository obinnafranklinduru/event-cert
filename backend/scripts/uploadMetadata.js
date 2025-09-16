require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse");
const pinataSDK = require("@pinata/sdk");

// --- Configuration ---
const CONFIG = {
  // Path to the input CSV file containing attendee data.
  csvFilePath: path.join(__dirname, "..", "attendees.csv"),
  // Path to the output directory where personalized metadata will be saved.
  outputDir: path.join(__dirname, "..", "assets", "metadata"),
  // Path to the file containing the IPFS CID of the image folder
  imageCIDPath: path.join(__dirname, "..", "ipfsCID", "imageCID.txt"),
  // Path to save the JSON folder CID after upload
  jsonCIDPath: path.join(__dirname, "..", "ipfsCID", "jsonCID.txt"),
  // A generic description for all certificates.
  description:
    "This certificate is a permanent, non-transferable record of attendance for the BaseDev Lagos 2025 event.",
  // The name of the event, used in the NFT name and attributes.
  eventName: "BaseDev Lagos 2025 Certificate",
  // Pinata API credentials
  pinataApiKey: process.env.PINATA_API_KEY,
  pinataSecretKey: process.env.PINATA_API_SECRET,
};

/**
 * Main function to generate all metadata files and upload to IPFS.
 */
async function generateMetadata() {
  console.log("--- Starting Metadata Generation ---");

  // 1. Read Image Folder CID from file
  let imageFolderCID;
  try {
    if (!fs.existsSync(CONFIG.imageCIDPath)) {
      throw new Error(`Image CID file not found at: ${CONFIG.imageCIDPath}`);
    }
    imageFolderCID = fs.readFileSync(CONFIG.imageCIDPath, "utf8").trim();
    if (!imageFolderCID) {
      throw new Error("Image CID file is empty");
    }
    console.log(`Using Image Folder CID: ${imageFolderCID}`);
  } catch (error) {
    console.error("Error reading image CID:", error.message);
    console.error("Please run the image upload script first.");
    return;
  }

  // 2. Ensure the output directory exists.
  if (!fs.existsSync(CONFIG.outputDir)) {
    console.log(`Creating output directory: ${CONFIG.outputDir}`);
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  // 3. Read and parse the attendee data from the CSV file.
  const attendees = [];
  const parser = fs.createReadStream(CONFIG.csvFilePath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
    })
  );

  for await (const record of parser) {
    if (record.name && record.walletAddress) {
      attendees.push(record);
    }
  }
  console.log(`Found ${attendees.length} attendees in ${CONFIG.csvFilePath}`);

  // 4. Loop through each attendee and generate their personalized metadata file.
  for (const attendee of attendees) {
    const { name, walletAddress } = attendee;
    const lowerCaseAddress = walletAddress.toLowerCase();

    console.log(`Generating metadata for: ${name} (${lowerCaseAddress})`);

    // Construct the full IPFS URL for the attendee's personalized image.
    const imageUrl = `https://ipfs.io/ipfs/${imageFolderCID}/${lowerCaseAddress}.png`;

    // Create the metadata object.
    const metadata = {
      name: `${CONFIG.eventName} - ${name}`,
      description: CONFIG.description,
      image: imageUrl,
      attributes: [
        {
          trait_type: "Event",
          value: "BaseDev Lagos 2025",
        },
        {
          trait_type: "Attendee",
          value: name,
        },
      ],
    };

    // 5. Save the metadata object as a new JSON file.
    const outputPath = path.join(CONFIG.outputDir, `${lowerCaseAddress}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
  }

  console.log(`All JSON files have been saved to: ${CONFIG.outputDir}`);

  // 6. Upload metadata folder to IPFS and save CID
  try {
    console.log("--- Uploading Metadata Folder to IPFS ---");

    if (!CONFIG.pinataApiKey || !CONFIG.pinataSecretKey) {
      throw new Error("Pinata API keys not found in .env file.");
    }

    const pinata = new pinataSDK(CONFIG.pinataApiKey, CONFIG.pinataSecretKey);

    console.log("Connecting to Pinata...");
    await pinata.testAuthentication();
    console.log("Pinata connection successful!");

    console.log(`Uploading metadata folder: ${CONFIG.outputDir}`);
    const result = await pinata.pinFromFS(CONFIG.outputDir, {
      pinataMetadata: { name: `EventCert-Metadata-${Date.now()}` },
    });

    const jsonFolderCID = `https://ipfs.io/ipfs/${result.IpfsHash}/`;

    // Ensure the ipfsCID directory exists
    const ipfsCIDDir = path.dirname(CONFIG.jsonCIDPath);
    if (!fs.existsSync(ipfsCIDDir)) {
      fs.mkdirSync(ipfsCIDDir, { recursive: true });
    }

    // Save the JSON folder CID to file
    fs.writeFileSync(CONFIG.jsonCIDPath, jsonFolderCID);
    console.log(`JSON IPFS CID saved to: ${CONFIG.jsonCIDPath}`);

    console.log(`\n--- Metadata Upload Complete! ---`);
    console.log(`JSON Folder CID: ${jsonFolderCID}`);
  } catch (error) {
    console.error(
      "An error occurred during the metadata upload process:",
      error
    );
  }
}

// Run the generation process.
generateMetadata().catch((error) => {
  console.error("An unexpected error occurred:", error);
});
