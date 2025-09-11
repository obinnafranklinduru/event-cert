require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse");

// --- Configuration ---
// This object holds all the paths and settings for the script.
const CONFIG = {
  // Path to the input CSV file containing attendee data.
  csvFilePath: path.join(__dirname, "..", "attendees.csv"),
  // Path to the output directory where personalized metadata will be saved.
  outputDir: path.join(__dirname, "..", "assets", "metadata"),
  // The IPFS CID of the folder containing all the personalized certificate images.
  // Make sure this is set in your .env file.
  imageFolderCID: process.env.IMAGE_FOLDER_CID,
  // A generic description for all certificates.
  description:
    "This certificate is a permanent, non-transferable record of attendance for the BaseDev Lagos 2025 event.",
  // The name of the event, used in the NFT name and attributes.
  eventName: "BaseDev Lagos 2025 Certificate",
};

/**
 * Main function to generate all metadata files.
 */
async function generateMetadata() {
  console.log("--- Starting Metadata Generation ---");

  // 1. Validate that the Image Folder CID is set.
  if (!CONFIG.imageFolderCID) {
    console.error("Error: IMAGE_FOLDER_CID is not set in your .env file.");
    console.error(
      "Please upload your images folder to IPFS and add the CID to your .env file."
    );
    return; // Exit if the CID is missing.
  }
  console.log(`Using Image Folder CID: ${CONFIG.imageFolderCID}`);

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
    const imageUrl = `https://ipfs.io/ipfs/${CONFIG.imageFolderCID}/${lowerCaseAddress}.png`;

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
    // The filename is the attendee's wallet address in lowercase.
    const outputPath = path.join(CONFIG.outputDir, `${lowerCaseAddress}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
  }

  console.log(`--- Metadata generation complete! ---`);
  console.log(`All JSON files have been saved to: ${CONFIG.outputDir}`);
}

// Run the generation process.
generateMetadata().catch((error) => {
  console.error("An unexpected error occurred:", error);
});
