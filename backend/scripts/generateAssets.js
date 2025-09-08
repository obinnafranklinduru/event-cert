const { createCanvas, loadImage, registerFont } = require("canvas");
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse");

// --- Configuration ---
const CONFIG = {
  // Path to the input CSV file containing attendee data.
  csvFilePath: path.join(__dirname, "..", "attendees.csv"),
  // Path to the base certificate template image.
  templateImagePath: path.join(
    __dirname,
    "..",
    "assets",
    "certificate-template.png"
  ),
  // Path to the output directory where personalized certificates will be saved.
  outputDir: path.join(__dirname, "..", "assets", "images"),
  // Font settings for writing the attendee's name on the certificate.
  font: {
    name: "Sans-Serif",
    size: 48,
    color: "#1a202c",
  },
  // The X and Y coordinates where the attendee's name will be written.
  // You will need to adjust these based on your template design.
  namePosition: {
    x: 600, // Center X coordinate
    y: 450, // Center Y coordinate
  },
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

  // Optional: Register a custom font if you have one.
  // Create an assets/fonts directory and place your .ttf file there.
  if (fs.existsSync(CONFIG.font.path)) {
    registerFont(CONFIG.font.path, { family: CONFIG.font.name });
    console.log(`Registered custom font: ${CONFIG.font.name}`);
  } else {
    console.warn(
      `Warning: Custom font not found at ${CONFIG.font.path}. Using default system font.`
    );
  }

  // 2. Load the certificate template image.
  let templateImage;
  try {
    templateImage = await loadImage(CONFIG.templateImagePath);
    console.log(
      `Template image loaded successfully from ${CONFIG.templateImagePath}`
    );
  } catch (error) {
    console.error(
      `Error: Failed to load the template image at ${CONFIG.templateImagePath}.`
    );
    console.error("Please ensure the file exists and is a valid image.");
    return; // Exit if template is missing.
  }

  // 3. Read and parse the attendee data from the CSV file.
  const attendees = [];
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

  // 4. Loop through each attendee and generate their personalized certificate.
  for (const attendee of attendees) {
    const { name, walletAddress } = attendee;
    console.log(`Generating certificate for: ${name} (${walletAddress})`);

    // Create a new canvas with the same dimensions as the template.
    const canvas = createCanvas(templateImage.width, templateImage.height);
    const ctx = canvas.getContext("2d");

    // Draw the base template image onto the canvas.
    ctx.drawImage(templateImage, 0, 0);

    // Configure the text properties for the name.
    ctx.font = `${CONFIG.font.size}px ${CONFIG.font.name}`;
    ctx.fillStyle = CONFIG.font.color;
    ctx.textAlign = "center"; // Center the text horizontally.
    ctx.textBaseline = "middle"; // Center the text vertically.

    // Write the attendee's name onto the canvas at the specified position.
    ctx.fillText(name, CONFIG.namePosition.x, CONFIG.namePosition.y);

    // 5. Save the canvas as a new PNG file.
    // The filename is the attendee's wallet address in lowercase.
    const outputPath = path.join(
      CONFIG.outputDir,
      `${walletAddress.toLowerCase()}.png`
    );
    const out = fs.createWriteStream(outputPath);
    const stream = canvas.createPNGStream();
    stream.pipe(out);
    await new Promise((resolve) => out.on("finish", resolve));
  }

  console.log(`--- Certificate generation complete! ---`);
  console.log(
    `All personalized images have been saved to: ${CONFIG.outputDir}`
  );
}

// Run the generation process.
generateCertificates().catch((error) => {
  console.error("An unexpected error occurred:", error);
});
