require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse");

// --- Configuration ---
// This object holds all the paths and settings for the script.
const CONFIG = {
  csvFilePath: path.join(__dirname, "..", "attendees.csv"),
  outputDir: path.join(__dirname, "..", "assets", "metadata"),
  imageBaseUrl: process.env.IPFS_GATEWAY_URL || "https://ipfs.io/ipfs",
  imageFolderCID: process.env.IMAGE_FOLDER_CID,
  eventName: "Fundamental Project Management Training",
  issuer: "Libertas Alpha Technologies",
  eventDate: "2025-09-12",
  format: "Virtual Workshop",
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
      description: `Fundamental Project Management Training Soulbound Token is a non-transferable certificate awarded to ${name} for successful completion of the ${CONFIG.eventName} hosted by ${CONFIG.issuer}.`,
      external_url: "https://www.libertasalpha.com/",
      image: imageUrl,
      name: `${CONFIG.eventName} Certificate - ${name}`,
      attributes: [
        {
          trait_type: "Recipient",
          value: name,
        },
        {
          trait_type: "Issuer",
          value: CONFIG.issuer,
        },
        {
          trait_type: "Date of Completion",
          value: CONFIG.eventDate,
        },
        {
          trait_type: "Format",
          value: CONFIG.format,
        },
        {
          trait_type: "Token Standard",
          value: "Fundamental Project Management Training Certificate (FPMTC)",
        },
        {
          trait_type: "Wallet Address",
          value: walletAddress,
        },
      ],
      certificate_details: {
        issuing_authority: `${CONFIG.issuer} Training`,
        course_title: CONFIG.eventName,
        course_description:
          "A comprehensive training session covering the core principles and methodologies of effective project management.",
        completion_criteria:
          "Attendance and participation in the full duration of the virtual training session.",
      },
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
