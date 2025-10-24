const { createCanvas, loadImage, registerFont } = require("canvas");
const fs = require("fs").promises;
const path = require("path");

// Default paths (but should be overridden by caller)
const defaultInputImage = path.join(
  __dirname,
  "..",
  "assets",
  "certificate.png"
);

registerFont(
  path.join(__dirname, "..", "assets", "fonts", "EBGaramond-Bold.ttf"),
  { family: "EB Garamond" }
);

async function editCertificate({
  inputPath = defaultInputImage,
  outputPath = null,
  newName = "Ada Lovelace",
  textColor = "#7b3fe4",
} = {}) {
  // Validate required parameters
  if (!outputPath) {
    throw new Error("outputPath is required");
  }

  if (!newName || newName.trim().length === 0) {
    throw new Error("newName cannot be empty");
  }

  try {
    // Check if input file exists
    await fs.access(inputPath);

    const img = await loadImage(inputPath);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext("2d");

    // ---- Auto compute rectangle based on image dimensions ----
    const rect = {
      x: img.width * 0.25,
      y: img.height * 0.42,
      w: img.width * 0.6,
      h: img.height * 0.1,
    };

    // Draw original certificate
    ctx.drawImage(img, 0, 0);

    // ---- Optimized font scaling ----
    let currentSize = Math.floor(img.height * 0.07);
    const minFontSize = Math.floor(img.height * 0.03);

    ctx.font = `${currentSize}px 'EB Garamond'`;
    let textWidth = ctx.measureText(newName).width;

    const stepSize = Math.max(1, Math.floor(currentSize * 0.1));

    const fontFamily = "EB Garamond";

    while (
      (textWidth > rect.w || currentSize > rect.h) &&
      currentSize > minFontSize
    ) {
      currentSize -= stepSize;
      ctx.font = `${currentSize}px ${fontFamily}`;
      textWidth = ctx.measureText(newName).width;
    }

    // ---- Center text in rectangle ----
    ctx.fillStyle = textColor;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center"; // Better centering

    const textX = rect.x + rect.w / 2; // Center alignment
    const textY = rect.y + rect.h / 2;

    ctx.fillText(newName, textX, textY);

    // Verify font usage
    const finalFont = ctx.font;
    console.log(`Final font used: ${finalFont}`);

    // Save certificate
    const buffer = canvas.toBuffer("image/png");
    await fs.writeFile(outputPath, buffer);

    console.log(`✅ Certificate saved at ${outputPath}`);

    // Clean up
    canvas.width = canvas.height = 0;
  } catch (err) {
    console.error("❌ Error editing certificate:", err);
    throw err;
  }
}

// Test function to verify font is working
async function testFont() {
  const testCanvas = createCanvas(100, 100);
  const testCtx = testCanvas.getContext("2d");

  testCtx.font = "20px 'EB Garamond'";
  const availableFonts = testCtx.getContextAttributes().font;
  console.log("Available fonts:", availableFonts);

  // Test if font is loaded by measuring text
  const measure = testCtx.measureText("Test");
  console.log("Font measurement test:", measure);
}

// Run test if this file is executed directly
if (require.main === module) {
  testFont().catch(console.error);
}

module.exports = editCertificate;
