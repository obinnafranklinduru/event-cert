const fs = require("fs");
const path = require("path");
const { JsonRpcProvider, Wallet, Contract } = require("ethers");
const { AppError } = require("../middleware/errorHandler");

let deployedContract;
let relayerWallet;

try {
  const abiPath = path.join(__dirname, "EventCertificateABI.json");
  const contractAbi = JSON.parse(fs.readFileSync(abiPath, "utf8"));

  const provider = new JsonRpcProvider(process.env.BASE_SEPOLIA_RPC_URL);
  relayerWallet = new Wallet(process.env.RELAYER_PRIVATE_KEY, provider);

  const contractAddress = process.env.EVENT_CERT_CONTRACT_ADDRESS;

  deployedContract = new Contract(contractAddress, contractAbi, relayerWallet);
} catch (error) {
  throw new AppError(error.message, 500);
}

module.exports = { deployedContract, relayerWallet };
