const { isAddress, getAddress } = require("ethers");
const getProofForAddress = require("../services/proofService");
const mintNFT = require("../services/relayerService");
const { AppError } = require("../middleware/errorHandler");

/**
 * Provides the Merkle proof for a given wallet address.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const getProof = (req, res, next) => {
  try {
    const { address } = req.query;

    if (!address)
      return next(new AppError("Address query parameter is required", 400));

    if (!isAddress(address))
      return next(new AppError("Invalid Ethereum address format", 400));

    const normalizedAddress = getAddress(address);
    const proof = getProofForAddress(normalizedAddress);

    if (!proof)
      return next(new AppError("Address not found in whitelist", 404));

    res.status(200).json({
      success: true,
      data: { proof },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submits a transaction to the smart contract to mint an NFT.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const mintCertificate = async (req, res, next) => {
  try {
    const { attendee, merkleProof } = req.body;

    // Validation
    if (!attendee || !merkleProof)
      return next(
        new AppError("Missing required fields: attendee and merkleProof", 400)
      );

    if (!isAddress(attendee))
      return next(
        new AppError("Invalid Ethereum address format for attendee", 400)
      );

    if (!Array.isArray(merkleProof) || merkleProof.length === 0)
      return next(new AppError("Invalid merkle proof format", 400));

    const normalizedAddress = getAddress(attendee);
    const transactionHash = await mintNFT(normalizedAddress, merkleProof);
    console.log("show", transactionHash);

    if (!transactionHash)
      return next(new AppError("Minting transaction failed", 500));

    res.status(200).json({
      success: true,
      data: { transactionHash },
      message: "Certificate minted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProof, mintCertificate };
