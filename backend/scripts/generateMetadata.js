require("dotenv").config();
const fs = require("fs");
const fsp = require("fs").promises;
const path = require("path");
const { parse } = require("csv-parse");

// --- Configuration ---
const CONFIG = {
  csvFilePath: path.join(__dirname, "..", "data", "attendees.csv"),
  outputDir: path.join(__dirname, "..", "assets", "metadata"),
  imageBaseUrl: process.env.IPFS_GATEWAY_URL || "https://ipfs.io/ipfs",
  eventName: "Fundamental Project Management Training",
  issuer: "Libertas Alpha Technologies",
  eventDate: "2025-09-12",
  format: "Virtual Workshop",
  maxNameLength: 100,
  walletAddressLength: 42,
};

const IPFS_IMAGE_CID_PATH = path.join(
  __dirname,
  "..",
  "ipfsCID",
  "imageCID.txt"
);

/**
 * Extracts CID from imageCID.txt file content
 */
function extractCID(content) {
  const trimmed = content.trim();
  // Handle both raw CID and full URL formats
  if (trimmed.startsWith("http")) {
    const parts = trimmed.split("/");
    return parts[parts.length - 1]; // Get last part which should be CID
  }
  return trimmed; // Assume it's already just CID
}

/**
 * Validates wallet address format
 */
function validateWalletAddress(address) {
  if (!address || typeof address !== "string") {
    throw new Error("Wallet address is required");
  }

  const cleanAddress = address.toLowerCase().trim();

  if (cleanAddress.length !== CONFIG.walletAddressLength) {
    throw new Error(`Invalid wallet address length: ${cleanAddress}`);
  }

  if (!cleanAddress.startsWith("0x")) {
    throw new Error("Wallet address must start with 0x");
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(cleanAddress)) {
    throw new Error("Invalid wallet address format");
  }

  return cleanAddress;
}

/**
 * Validates attendee name
 */
function validateName(name) {
  if (!name || name.trim().length === 0) {
    throw new Error("Attendee name is required");
  }

  const cleanName = name.trim();

  if (cleanName.length > CONFIG.maxNameLength) {
    throw new Error(
      `Name exceeds maximum length of ${CONFIG.maxNameLength} characters`
    );
  }

  return cleanName.replace(/\s+/g, " ");
}

/**
 * Processes CSV file with streaming and validation
 */
async function processCSVFile(filePath) {
  const attendees = [];
  const seenAddresses = new Set();
  const errors = [];
  let rowNumber = 0;

  return new Promise((resolve, reject) => {
    const parser = fs.createReadStream(filePath).pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })
    );

    parser.on("data", (record) => {
      rowNumber++;
      try {
        if (!record.name || !record.walletAddress) {
          throw new Error("Missing required fields: name or walletAddress");
        }

        const name = validateName(record.name);
        const walletAddress = validateWalletAddress(record.walletAddress);
        console.log(`Processing row ${rowNumber}: ${name} - ${walletAddress}`);

        if (seenAddresses.has(walletAddress)) {
          throw new Error(`Duplicate wallet address: ${walletAddress}`);
        }

        seenAddresses.add(walletAddress);
        attendees.push({ name, walletAddress, rowNumber });
      } catch (error) {
        errors.push(`Row ${rowNumber}: ${error.message}`);
      }
    });

    parser.on("end", () => {
      if (errors.length > 0) {
        console.warn(`CSV processing completed with ${errors.length} errors`);
        errors.forEach((error) => console.warn(`  ⚠️  ${error}`));
      }
      resolve({ attendees, errors });
    });

    parser.on("error", (error) => {
      reject(new Error(`CSV parsing error: ${error.message}`));
    });
  });
}

/**
 * Generates metadata for a single attendee
 */
function generateAttendeeMetadata(attendee, imageFolderCID) {
  const imageUrl = `${CONFIG.imageBaseUrl}/${imageFolderCID}/${attendee.walletAddress}.png`;

  return {
    description: `Fundamental Project Management Training Soulbound Token is a non-transferable certificate awarded to ${attendee.name} for successful completion of the ${CONFIG.eventName} hosted by ${CONFIG.issuer}.`,
    external_url: "https://www.libertasalpha.com/",
    image: imageUrl,
    name: `${CONFIG.eventName} Certificate - ${attendee.name}`,
    attributes: [
      {
        trait_type: "Recipient",
        value: attendee.name,
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
        value: "Soulbound (SBT)",
      },
      {
        trait_type: "Wallet Address",
        value: attendee.walletAddress,
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
}

/**
 * Main optimized metadata generation function
 * Overall Time: O(n), Space: O(1) - streams data sequentially
 */
async function generateMetadata() {
  console.log("--- Starting Optimized Metadata Generation ---");
  const startTime = Date.now();

  try {
    // Phase 1: Validate inputs - O(1)
    await fsp.access(CONFIG.csvFilePath);
    await fsp.access(IPFS_IMAGE_CID_PATH);

    const imageCIDContent = await fsp.readFile(IPFS_IMAGE_CID_PATH, "utf8");
    const imageFolderCID = extractCID(imageCIDContent);
    console.log(`✅ Using Image Folder CID: ${imageFolderCID}`);

    // Phase 2: Ensure output directory - O(1)
    await fsp.mkdir(CONFIG.outputDir, { recursive: true });

    // Phase 3: Process CSV with streaming - O(n)
    console.log(`📊 Processing CSV file: ${CONFIG.csvFilePath}`);
    const { attendees, errors } = await processCSVFile(CONFIG.csvFilePath);

    if (attendees.length === 0) {
      throw new Error("No valid attendees found in CSV file");
    }

    console.log(`✅ Validated ${attendees.length} attendees`);

    // Phase 4: Generate metadata files - O(n)
    let successCount = 0;
    const generationErrors = [];

    for (const attendee of attendees) {
      try {
        const metadata = generateAttendeeMetadata(attendee, imageFolderCID);
        const outputPath = path.join(
          CONFIG.outputDir,
          `${attendee.walletAddress}.json`
        );

        await fsp.writeFile(outputPath, JSON.stringify(metadata, null, 2));
        successCount++;

        if (successCount % 100 === 0) {
          console.log(`📝 Generated ${successCount} metadata files...`);
        }
      } catch (error) {
        generationErrors.push(
          `Failed for ${attendee.walletAddress}: ${error.message}`
        );
      }
    }

    // Phase 5: Report results - O(1)
    const duration = Date.now() - startTime;

    console.log(`\n--- Metadata Generation Complete! ---`);
    console.log(`✅ Successfully generated: ${successCount} files`);
    console.log(`❌ Failed: ${generationErrors.length} files`);
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📁 Output directory: ${CONFIG.outputDir}`);

    if (generationErrors.length > 0) {
      console.warn("\nGeneration errors:");
      generationErrors.forEach((error) => console.warn(`  ⚠️  ${error}`));
    }

    if (errors.length > 0) {
      console.warn(`\nCSV parsing warnings: ${errors.length} rows had issues`);
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
  generateMetadata().catch((error) => {
    console.error("Critical error:", error);
    process.exit(1);
  });
}

module.exports = {
  generateMetadata,
  validateWalletAddress,
  validateName,
  processCSVFile,
};
