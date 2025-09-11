const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse");
const editCertificate = require("./certificate-editor");

// --- Configuration ---
const CONFIG = {
  // Path to the input CSV file containing attendee data.
  csvFilePath: path.join(__dirname, "..", "attendees.csv"),

  // Path to the output directory where personalized certificates will be saved.
  outputDir: path.join(__dirname, "..", "assets", "images"),
};

/**
 * Main function to generate all certificate assets.
 */
async function generateCertificates() {
  console.log("--- Starting Certificate Generation ---");

  // 1. Ensure the output directory exists.
  if (!fs.existsSync(CONFIG.outputDir)) {
    console.log(`Creating output directory: ${CONFIG.outputDir}`);
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  // 2. Read and parse the attendee data from the CSV file.
  const attendees = [];

  if (!fs.existsSync(CONFIG.csvFilePath)) {
    console.error(`Error: CSV file not found at ${CONFIG.csvFilePath}`);
    return;
  }

  const parser = fs.createReadStream(CONFIG.csvFilePath).pipe(
    parse({
      columns: true, // Treat the first row as headers.
      skip_empty_lines: true,
    })
  );

  for await (const record of parser) {
    if (record.name && record.walletAddress) {
      attendees.push(record);
    }
  }
  console.log(`Found ${attendees.length} attendees in ${CONFIG.csvFilePath}`);

  if (attendees.length === 0) {
    console.warn("No valid attendees found in the CSV file.");
    return;
  }

  // 3. Validate CSV structure
  if (!validateCSVStructure(attendees)) {
    console.error(
      "CSV structure is invalid. Ensure it has 'name' and 'walletAddress' columns."
    );
    return;
  }

  // 4. Loop through each attendee and generate their personalized certificate.
  let successCount = 0;
  let errorCount = 0;

  for (const [index, attendee] of attendees.entries()) {
    const { name, walletAddress } = attendee;
    console.log(
      `[${index + 1}/${
        attendees.length
      }] Generating certificate for: ${name} (${walletAddress})`
    );

    try {
      // Create output path using wallet address
      const outputPath = path.join(
        CONFIG.outputDir,
        `${walletAddress.toLowerCase()}.png`
      );

      // Use the certificate editor to generate the personalized certificate
      await editCertificate({
        inputPath: CONFIG.templateImagePath,
        outputPath: outputPath,
        newName: name,
      });

      successCount++;
      console.log(`Certificate saved: ${outputPath}`);
    } catch (error) {
      errorCount++;
      console.error(
        `Failed to generate certificate for ${name}:`,
        error.message
      );
    }
  }

  console.log(`--- Certificate generation complete! ---`);
  console.log(`Successfully generated: ${successCount} certificates`);
  if (errorCount > 0) {
    console.log(`Failed to generate: ${errorCount} certificates`);
  }
  console.log(`All certificates saved to: ${CONFIG.outputDir}`);
}

// Helper function to validate CSV structure
function validateCSVStructure(attendees) {
  if (attendees.length === 0) return false;

  const requiredFields = ["name", "walletAddress"];
  const firstRecord = attendees[0];

  return requiredFields.every((field) => field in firstRecord);
}

// Run the generation process.
generateCertificates().catch((error) => {
  console.error("An unexpected error occurred:", error);
});
