const { deployedContract, relayerWallet } = require("../config/web");
const { AppError } = require("../middleware/errorHandler");

/**
 * Submits the mint transaction to the blockchain.
 * @param {string} attendee The address of the user who will receive the NFT.
 * @param {string[]} merkleProof The Merkle proof for the attendee.
 * @returns {Promise<string>} The transaction hash.
 * @throws {Error} If the transaction fails.
 */
async function mintNFT(attendee, merkleProof) {
  try {
    const alreadyMinted = await deployedContract.hasMinted(attendee);
    if (alreadyMinted)
      throw new AppError("Address has already minted a certificate", 400);

    const tx = await deployedContract.mint(attendee, merkleProof, {
      from: relayerWallet.address,
    });

    await tx.wait();

    return tx.hash;
  } catch (error) {
    throw new AppError(error.message, 500);
  }
}

module.exports = mintNFT;
