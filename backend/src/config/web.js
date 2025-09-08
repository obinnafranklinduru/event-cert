require("dotenv").config();
const { ethers } = require("ethers");

// --- Ethers Provider Setup ---
// The provider is our read-only connection to the blockchain.
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
console.log(`🔌 Connected to blockchain via RPC: ${process.env.RPC_URL}`);

// --- Relayer Wallet (Signer) Setup ---
// The signer is our wallet instance that can sign and send transactions.
// It is initialized with the relayer's private key.
if (!process.env.RELAYER_PRIVATE_KEY) {
  throw new Error(
    "RELAYER_PRIVATE_KEY is not set in the .env file. The server cannot start."
  );
}
const relayerWallet = new ethers.Wallet(
  process.env.RELAYER_PRIVATE_KEY,
  provider
);
console.log(`Relayer wallet loaded for address: ${relayerWallet.address}`);

// --- Contract ABI ---
// A minimal ABI for the EventCertificate contract, only including the 'mint' function.
// This is used to interact with the contract.
const contractAbi = [
  "function mint(address attendee, bytes32[] calldata merkleProof)",
];

// --- Contract Instance ---
// The contract instance is our primary way of interacting with the smart contract.
if (!process.env.CONTRACT_ADDRESS) {
  throw new Error(
    "CONTRACT_ADDRESS is not set in the .env file. The server cannot start."
  );
}
const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  contractAbi,
  relayerWallet
);
console.log(`Connected to smart contract at address: ${contract.address}`);

module.exports = {
  provider,
  relayerWallet,
  contract,
};
