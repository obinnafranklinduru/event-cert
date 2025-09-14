const { JsonRpcProvider, Wallet, Contract } = require("ethers");
const { AppError } = require("../middleware/errorHandler");

let deployedContract;
let relayerWallet;

try {
  const provider = new JsonRpcProvider(process.env.BASE_SEPOLIA_RPC_URL);
  relayerWallet = new Wallet(process.env.RELAYER_PRIVATE_KEY, provider);

  const contractAbi = [
    "function mint(address attendee, bytes32[] calldata merkleProof)",
    "function hasMinted(address) view returns (bool)",
  ];
  const contractAddress = process.env.EVENT_CERT_CONTRACT_ADDRESS;

  deployedContract = new Contract(contractAddress, contractAbi, relayerWallet);
} catch (error) {
  throw new AppError(error.message, 500);
}

module.exports = { deployedContract, relayerWallet };
