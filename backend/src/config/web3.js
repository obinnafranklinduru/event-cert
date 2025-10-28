const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const { AppError } = require("../middleware/errorHandler");

let deployedContract, relayerWallet, provider;

try {
  const contractArtifactPath = path.join(__dirname, "EventCertificateABI.json");

  if (!fs.existsSync(contractArtifactPath)) {
    throw new Error(
      `Contract artifact not found at path: ${contractArtifactPath}. Please ensure the ABI file is present.`
    );
  }

  const contractArtifact = JSON.parse(
    fs.readFileSync(contractArtifactPath, "utf8")
  );

  // Check if the ABI exists and is an array in the loaded file.
  if (!contractArtifact || !Array.isArray(contractArtifact.abi)) {
    throw new Error(
      `ABI not found or is not an array in the artifact file: ${contractArtifactPath}`
    );
  }

  const contractABI = contractArtifact.abi;

  // Setup Provider and Wallets ---
  provider = new ethers.JsonRpcProvider(process.env.BASE_MAINNET_RPC_URL);
  relayerWallet = new ethers.Wallet(
    process.env.BASE_MAINNET_RELAYER_PRIVATE_KEY,
    provider
  );

  const contractAddress = process.env.EVENT_CERT_CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error(
      "EVENT_CERT_CONTRACT_ADDRESS is not set in your .env file."
    );
  }

  // Create Contract Instance with the Correct ABI ---
  deployedContract = new ethers.Contract(
    contractAddress,
    contractABI,
    relayerWallet
  );

  console.log("Web3 configuration loaded successfully.");
  console.log(`   - Contract attached at: ${contractAddress}`);
  console.log(`   - Relayer wallet configured: ${relayerWallet.address}`);
} catch (error) {
  // This will now throw a clear, actionable error if the setup fails.
  console.error("Failed to initialize Web3 configuration:");
  throw new AppError(error.message, 500);
}

module.exports = { deployedContract, relayerWallet, provider };
