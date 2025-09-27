const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse");
const editCertificate = require("./certificate-editor");

// --- Configuration ---
const CONFIG = {
  csvFilePath: path.join(__dirname, "..", "data", "attendees.csv"),
  outputDir: path.join(__dirname, "..", "assets", "images"),
  templateImagePath: path.join(__dirname, "..", "assets", "certificate.png"),
};

/**
 * Validates wallet address format
 */
function validateWalletAddress(address) {
  if (!address || typeof address !== "string") return false;
  const cleanAddress = address.trim();
  return (
    cleanAddress.length === 42 &&
    cleanAddress.startsWith("0x") &&
    /^0x[a-fA-F0-9]{40}$/.test(cleanAddress)
  );
}

/**
 * Validates and sanitizes name
 */
function validateName(name) {
  if (!name || name.trim().length === 0) return false;
  return name.trim().replace(/\s+/g, " ").substring(0, 100); // Limit to 100 chars
}

/**
 * Main function to generate all certificate assets.
 */
async function generateCertificates() {
  console.log("--- Starting Certificate Generation ---");

  if (!fs.existsSync(CONFIG.csvFilePath)) {
    throw new Error(`CSV file not found at ${CONFIG.csvFilePath}`);
  }

  if (!fs.existsSync(CONFIG.templateImagePath)) {
    throw new Error(`Template image not found at ${CONFIG.templateImagePath}`);
  }

  // Ensure output directory
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  // Read and parse CSV
  const attendees = [];
  const seenAddresses = new Set();

  const parser = fs.createReadStream(CONFIG.csvFilePath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })
  );

  for await (const record of parser) {
    if (record.name && record.walletAddress) {
      const validatedName = validateName(record.name);
      const validatedAddress = record.walletAddress.trim();

      if (validatedName && validateWalletAddress(validatedAddress)) {
        const addressLower = validatedAddress.toLowerCase();

        if (!seenAddresses.has(addressLower)) {
          seenAddresses.add(addressLower);
          attendees.push({
            name: validatedName,
            walletAddress: validatedAddress,
            walletAddressLower: addressLower,
          });
        } else {
          console.warn(`Duplicate wallet address skipped: ${validatedAddress}`);
        }
      } else {
        console.warn(
          `Invalid data skipped: ${record.name} - ${record.walletAddress}`
        );
      }
    }
  }

  console.log(`Found ${attendees.length} valid attendees`);

  if (attendees.length === 0) {
    throw new Error("No valid attendees found in CSV");
  }

  // Generate certificates
  let successCount = 0;
  let errorCount = 0;

  for (const [index, attendee] of attendees.entries()) {
    console.log(
      `[${index + 1}/${attendees.length}] Generating for: ${attendee.name}`
    );

    try {
      const outputPath = path.join(
        CONFIG.outputDir,
        `${attendee.walletAddressLower}.png`
      );

      await editCertificate({
        inputPath: CONFIG.templateImagePath,
        outputPath: outputPath,
        newName: attendee.name,
        textColor: "#7b3fe4",
      });

      successCount++;
    } catch (error) {
      errorCount++;
      console.error(`Failed for ${attendee.name}:`, error.message);
    }
  }

  console.log(`--- Certificate generation complete! ---`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📁 Output: ${CONFIG.outputDir}`);
}

// Run with proper error handling
generateCertificates().catch((error) => {
  console.error("Certificate generation failed:", error);
  process.exit(1);
});
