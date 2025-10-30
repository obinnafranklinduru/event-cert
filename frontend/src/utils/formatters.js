import { NETWORKS } from "./constants.js";

/**
 * Formats an Ethereum address for display
 * @param {string} address - The full address
 * @param {number} prefixLength - Number of characters to show at start
 * @param {number} suffixLength - Number of characters to show at end
 * @returns {string} Formatted address
 */
export const formatAddress = (address, prefixLength = 6, suffixLength = 4) => {
  if (!address) return "";
  if (address.length <= prefixLength + suffixLength) return address;

  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
};

/**
 * Gets the block explorer URL for a transaction
 * @param {string} txHash - Transaction hash
 * @param {string} networkId - Network ID (hex)
 * @returns {string} Explorer URL
 */
export const getExplorerUrl = (txHash, networkId = "0x2105") => {
  const network = Object.values(NETWORKS).find((n) => n.id === networkId);
  const explorerUrl = network?.explorerUrl || NETWORKS.BASE_MAINNET.explorerUrl;
  return `${explorerUrl}/tx/${txHash}`;
};

/**
 * Formats a timestamp to a readable string
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Formatted time string
 */
export const formatTimestamp = (timestamp) => {
  return new Date(timestamp * 1000).toLocaleString();
};

/**
 * Validates an Ethereum address
 * @param {string} address - Address to validate
 * @returns {boolean} True if valid
 */
export const isValidAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Normalizes an address to checksum format
 * @param {string} address - Address to normalize
 * @returns {string} Checksummed address
 */
export const normalizeAddress = (address) => {
  if (!address) return "";
  return address.toLowerCase();
};

/**
 * Formats error messages for user display
 * @param {Error} error - Error object
 * @returns {string} User-friendly error message
 */
export const formatError = (error) => {
  if (!error) return "Unknown error occurred";

  // Handle common error patterns
  const message = error.message || error.toString();

  if (message.includes("user rejected")) {
    return "Transaction cancelled by user";
  }

  if (message.includes("insufficient funds")) {
    return "Insufficient funds for transaction";
  }

  if (message.includes("AlreadyMinted")) {
    return "Certificate already claimed";
  }

  if (message.includes("InvalidProof")) {
    return "Invalid eligibility proof";
  }

  if (message.includes("MintingNotActive")) {
    return "Claiming is not currently active";
  }

  return message.length > 100
    ? "Transaction failed. Please try again."
    : message;
};
