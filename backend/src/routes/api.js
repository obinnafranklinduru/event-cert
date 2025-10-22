const express = require("express");
const {
  getProof,
  mintCertificate,
  getCampaign,
} = require("../controllers/merkleController");

const router = express.Router();

/**
 * @route GET /api/campaigns/:campaignId
 * @description Retrieves public details for a specific campaign.
 * @param {string} param.campaignId - The ID of the campaign.
 * @returns {object} 200 - { success: true, data: { campaign: {...} } }
 */
router.get("/campaigns/:campaignId", getCampaign);

/**
 * @route GET /api/campaigns/:campaignId/get-proof
 * @description Provides the Merkle proof for a given wallet address for a specific campaign.
 * @param {string} param.campaignId - The ID of the campaign.
 * @param {string} query.address - The attendee's wallet address.
 * @returns {object} 200 - { success: true, data: { proof: [...] } }
 */
router.get("/campaigns/:campaignId/get-proof", getProof);

/**
 * @route POST /api/campaigns/:campaignId/mint
 * @description Submits a transaction to the smart contract to mint an NFT for a specific campaign.
 * @param {string} param.campaignId - The ID of the campaign.
 * @body {string} attendee - The wallet address of the person receiving the NFT.
 * @body {string[]} merkleProof - The Merkle proof for the attendee.
 * @returns {object} 200 - { success: true, data: { transactionHash: "0x..." } }
 */
router.post("/campaigns/:campaignId/mint", mintCertificate);

module.exports = router;
