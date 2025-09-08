const { getProofForAddress } = require("../services/proofService");
const { mintNFT } = require("../services/relayerService");

/**
 * Provides the Merkle proof for a given wallet address.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getProof = (req, res) => {
  const { address } = req.query;

  if (!address) {
    return res
      .status(400)
      .json({ success: false, message: "Address parameter is required." });
  }

  try {
    const proof = getProofForAddress(address);
    if (proof) {
      res.json({ success: true, proof });
    } else {
      res
        .status(404)
        .json({ success: false, message: "Address not found in whitelist." });
    }
  } catch (error) {
    console.error(`[GET /get-proof] Error:`, error);
    res
      .status(500)
      .json({ success: false, message: "An internal server error occurred." });
  }
};

/**
 * Submits a transaction to the smart contract to mint an NFT.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const mintCertificate = async (req, res) => {
  const { attendee, merkleProof } = req.body;

  if (!attendee || !merkleProof) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: attendee and merkleProof.",
    });
  }

  console.log(`[POST /mint] Received mint request for attendee: ${attendee}`);

  try {
    const transactionHash = await mintNFT(attendee, merkleProof);
    res.json({ success: true, transactionHash });
  } catch (error) {
    console.error(`[POST /mint] Transaction failed:`, error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProof,
  mintCertificate,
};
