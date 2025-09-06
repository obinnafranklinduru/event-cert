require("dotenv").config({ path: process.env.ENV_PATH || "../.env" });
module.exports = {
  PRIVATE_KEY_DEPLOYER: process.env.PRIVATE_KEY_DEPLOYER,
  PRIVATE_KEY_SIGNER: process.env.PRIVATE_KEY_SIGNER,
  PRIVATE_KEY_RELAYER: process.env.PRIVATE_KEY_RELAYER,
  BASE_SEPOLIA_RPC_URL: process.env.BASE_SEPOLIA_RPC_URL,
  PINATA_API_KEY: process.env.PINATA_API_KEY,
  PINATA_API_SECRET: process.env.PINATA_API_SECRET,
  SIGNER_SERVICE_PORT: process.env.SIGNER_SERVICE_PORT || 3001,
  RELAYER_SERVICE_PORT: process.env.RELAYER_SERVICE_PORT || 3002,
  SIGNER_SQLITE_DB: process.env.SIGNER_SQLITE_DB || "./data/signer.sqlite3",
  RELAYER_SQLITE_DB: process.env.RELAYER_SQLITE_DB || "./data/relayer.sqlite3",
  ASSETS_DIR: process.env.ASSETS_DIR || "./assets",
  MINT_REFUND_FEE_WEI: process.env.MINT_REFUND_FEE_WEI || "0",
};
