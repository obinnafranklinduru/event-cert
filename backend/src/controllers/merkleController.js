const { isAddress, getAddress } = require("ethers");
const getCampaignDetails = require("../services/campaignService");
const getProofForAddress = require("../services/proofService");
const mintNFT = require("../services/relayerService");
const findExistingMint = require("../services/mintService");
const { AppError } = require("../middleware/errorHandler");
const dbModel = require("../config/db");

/**
 * Provides the Merkle proof for a given wallet address for a specific campaign.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const getProof = (req, res, next) => {
  try {
    const { campaignId } = req.params;
    const { address } = req.query;

    if (!campaignId)
      return next(new AppError("Campaign ID is required in the URL path", 400));
    if (!address)
      return next(new AppError("Address query parameter is required", 400));
    if (!isAddress(address))
      return next(new AppError("Invalid Ethereum address format", 400));

    const normalizedAddress = getAddress(address);
    const proofData = getProofForAddress(normalizedAddress, campaignId);

    console.log("Proof data found:", proofData);

    if (!proofData || !proofData.proof)
      return next(
        new AppError("Address not found in whitelist for this campaign", 404)
      );

    res.status(200).json({
      success: true,
      data: { proof: proofData.proof },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submits a transaction to the smart contract to mint an NFT for a specific campaign.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const mintCertificate = async (req, res, next) => {
  try {
    const { campaignId } = req.params;
    const { attendee, merkleProof } = req.body;

    // Validation
    if (!campaignId)
      return next(new AppError("Campaign ID is required in the URL path", 400));
    if (!attendee || !merkleProof)
      return next(
        new AppError("Missing required fields: attendee and merkleProof", 400)
      );
    if (!isAddress(attendee))
      return next(
        new AppError("Invalid Ethereum address format for attendee", 400)
      );
    if (!Array.isArray(merkleProof))
      return next(
        new AppError("Invalid Merkle proof format; expected an array", 400)
      );

    const normalizedAddress = getAddress(attendee);
    const transactionHash = await mintNFT(
      normalizedAddress,
      campaignId,
      merkleProof
    );

    if (!transactionHash)
      return next(
        new AppError("Minting transaction failed to return a hash", 500)
      );

    const db = await dbModel;

    await new Promise((resolve, reject) => {
      const sql = `INSERT INTO mints (campaignId, attendeeAddress, transactionHash) VALUES (?, ?, ?)`;

      db.run(sql, [campaignId, normalizedAddress, transactionHash], (err) => {
        if (err) {
          console.error("Database error while recording mint:", err.message);
          return reject(
            new AppError("Minting succeeded, but failed to save record.", 500)
          );
        } else {
          resolve();
        }
      });
    });

    res.status(200).json({
      success: true,
      data: { transactionHash },
      message: "Certificate minting process initiated successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves public details for a specific campaign from the smart contract.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const getCampaign = async (req, res, next) => {
  try {
    const { campaignId } = req.params;
    if (!campaignId) {
      return next(new AppError("Campaign ID is required in the URL path", 400));
    }

    // This would call a new service to read from the contract's `getCampaign` view function
    const campaignDetails = await getCampaignDetails(campaignId);

    if (!campaignDetails) {
      return next(new AppError("Campaign not found", 404));
    }

    res.status(200).json({
      success: true,
      data: { campaign: campaignDetails },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves the original transaction hash for a user who has already minted.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const getMintTransaction = async (req, res, next) => {
  try {
    const { campaignId } = req.params;
    const { address } = req.query;

    // Validation
    if (!campaignId)
      return next(new AppError("Campaign ID is required in the URL path", 400));
    if (!address)
      return next(new AppError("Address query parameter is required", 400));
    if (!isAddress(address))
      return next(new AppError("Invalid Ethereum address format", 400));

    const normalizedAddress = getAddress(address);

    const transactionHash = await findExistingMint(
      normalizedAddress,
      campaignId
    );

    if (transactionHash) {
      // Found it!
      res.status(200).json({
        success: true,
        data: { transactionHash },
        message: "Previously minted transaction hash retrieved.",
      });
    } else {
      return next(
        new AppError(
          "Mint record not found in database. Please contact support.",
          404
        )
      );
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { getProof, mintCertificate, getCampaign, getMintTransaction };
