const { contract } = require("../config/web");

/**
 * Submits the mint transaction to the blockchain.
 * @param {string} attendee The address of the user who will receive the NFT.
 * @param {string[]} merkleProof The Merkle proof for the attendee.
 * @returns {Promise<string>} The transaction hash.
 * @throws {Error} If the transaction fails.
 */
async function mintNFT(attendee, merkleProof) {
  try {
    console.log(
      `[Relayer Service] Estimating gas for minting for attendee: ${attendee}`
    );
    // Estimate gas for the transaction to catch potential reverts early.
    const gasEstimate = await contract.estimateGas.mint(attendee, merkleProof);
    console.log(`[Relayer Service] Gas estimate: ${gasEstimate.toString()}`);

    // Send the transaction to the blockchain with a 20% gas buffer.
    console.log(`[Relayer Service] Submitting mint transaction...`);
    const tx = await contract.mint(attendee, merkleProof, {
      gasLimit: gasEstimate.mul(12).div(10),
    });

    console.log(`[Relayer Service] Transaction sent. Hash: ${tx.hash}`);
    return tx.hash;
  } catch (error) {
    console.error(`[Relayer Service] Transaction failed:`, error.message);
    // Re-throw the error with a more specific message for the route handler to catch.
    const reason = error.reason || "Transaction reverted with no reason.";
    throw new Error(`Failed to submit transaction: ${reason}`);
  }
}

module.exports = {
  mintNFT,
};
