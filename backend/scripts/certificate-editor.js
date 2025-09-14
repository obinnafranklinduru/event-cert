const { createCanvas, loadImage, registerFont } = require("canvas");
const fs = require("fs");
const path = require("path");

const inputImage = path.join(__dirname, "..", "assets", "certificate.png");
const outputImage = path.join(
  __dirname,
  "..",
  "assets",
  "images",
  "certificate_edited.png"
);

// Register your downloaded Google Font (.ttf file placed in assets/fonts)
registerFont(
  path.join(__dirname, "..", "assets", "fonts", "GreatVibes-Regular.ttf"),
  { family: "Great Vibes" }
);

async function editCertificate({
  inputPath = inputImage,
  outputPath = outputImage,
  newName = "Ada Lovelace",
  textColor = "#7b3fe4",
} = {}) {
  try {
    const img = await loadImage(inputPath);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext("2d");

    // ---- Auto compute rectangle based on image dimensions ----
    const rect = {
      x: img.width * 0.25, // 25% from left
      y: img.height * 0.42, // ~47% down from top
      w: img.width * 0.6, // 60% of image width
      h: img.height * 0.1, // 10% of image height
    };

    // Draw original certificate
    ctx.drawImage(img, 0, 0);

    // Removed the background fill section - no more covering old name area

    // ---- Auto font scaling ----
    let currentSize = Math.floor(img.height * 0.07); // start ~7% of height
    const minFontSize = Math.floor(img.height * 0.03); // don't shrink too small

    ctx.font = `${currentSize}px 'Great Vibes'`;
    let textWidth = ctx.measureText(newName).width;

    while (
      (textWidth > rect.w || currentSize > rect.h) &&
      currentSize > minFontSize
    ) {
      currentSize -= 2;
      ctx.font = `${currentSize}px 'Great Vibes'`;
      textWidth = ctx.measureText(newName).width;
    }

    // ---- Center text in rectangle ----
    ctx.fillStyle = textColor;
    ctx.textBaseline = "middle";

    const textX = rect.x + (rect.w - textWidth) / 2;
    const textY = rect.y + rect.h / 2;

    ctx.fillText(newName, textX, textY);

    // Save certificate
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(outputPath, buffer);

    console.log(
      `Certificate saved at ${outputPath} (font size: ${currentSize}px)`
    );
  } catch (err) {
    console.error("Error editing certificate:", err);
  }
}

module.exports = editCertificate;
