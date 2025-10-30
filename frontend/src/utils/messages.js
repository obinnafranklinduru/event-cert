// Cosmic status messages for different states
export const COSMIC_MESSAGES = {
  connecting: [
    "Summoning proofs from the ether...",
    "Checking your cosmic credentials...",
    "Aligning the blockchain constellations...",
    "Consulting the digital oracle...",
    "Scanning the cosmic registry...",
    "Validating your stellar identity...",
  ],

  minting: [
    "Broadcasting transaction to the Base network...",
    "Waiting for validators to work their magic...",
    "Confirming your place in the digital ledger...",
    "Weaving your certificate into the blockchain...",
    "Inscribing your mark in the cosmic record...",
    "Finalizing your digital attestation...",
  ],

  success: [
    "✨Your cosmic certificate has been successfully minted and added to your wallet.",
    "🌟 Congratulations! Previously minted transaction hash retrieved.",
    "✨ Welcome to the cosmic registry!",
    "🌟 Your digital proof awaits!",
    "🚀 Mission accomplished, cosmic traveler!",
  ],

  errors: {
    WALLET_CONNECTION: "Failed to connect wallet. Please try again.",
    NETWORK_ERROR: "Network connection issue. Please check your connection.",
    ALREADY_CLAIMED: "You have already claimed your certificate.",
    NOT_ELIGIBLE: "Your address is not eligible for this claim.",
    TRANSACTION_FAILED: "Transaction failed. Please try again.",
    INVALID_PROOF: "Invalid eligibility proof.",
    MINTING_INACTIVE: "Claiming is not currently active.",
    UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
  },
};

// Get a random message from a category
export const getRandomMessage = (category) => {
  const messages = COSMIC_MESSAGES[category];
  if (!messages || messages.length === 0) return "";
  return messages[Math.floor(Math.random() * messages.length)];
};

// Get cycling message (for rotating through messages)
export const getCyclingMessage = (category, index) => {
  const messages = COSMIC_MESSAGES[category];
  if (!messages || messages.length === 0) return "";
  return messages[index % messages.length];
};
