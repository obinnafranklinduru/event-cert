const express = require("express");
const {
  getProof,
  mintCertificate,
} = require("../controllers/merkleController");

const router = express.Router();

// --- API Endpoints ---

/**
 * @route GET /api/get-proof
 * @description Provides the Merkle proof for a given wallet address.
 * @param {string} query.address - The attendee's wallet address.
 * @returns {object} 200 - { success: true, proof: [...] }
 * @returns {object} 404 - { success: false, message: "Address not found in whitelist." }
 * @returns {object} 400 - { success: false, message: "Address parameter is required." }
 */
router.get("/get-proof", getProof);

/**
 * @route POST /api/mint
 * @description Submits a transaction to the smart contract to mint an NFT.
 * @body {string} attendee - The wallet address of the person receiving the NFT.
 * @body {string[]} merkleProof - The Merkle proof for the attendee.
 * @returns {object} 200 - { success: true, transactionHash: "0x..." }
 * @returns {object} 400 - { success: false, message: "Missing required fields." }
 * @returns {object} 500 - { success: false, message: "Failed to submit transaction." }
 */
router.post("/mint", mintCertificate);

module.exports = router;
