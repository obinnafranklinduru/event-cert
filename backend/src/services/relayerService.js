const { deployedContract, relayerWallet } = require("../config/web");
const { AppError } = require("../middleware/errorHandler");

/**
 * Submits the mint transaction to the blockchain.
 * @param {string} attendee The address of the user who will receive the NFT.
 * @param {string[]} merkleProof The Merkle proof for the attendee.
 * @returns {Promise<string>} The transaction hash.
 * @throws {Error} If the transaction fails.
 */
// async function mintNFT(attendee, merkleProof) {
//   try {
//     const alreadyMinted = await deployedContract.hasMinted(attendee);
//     console.log("inside");
//     console.log(alreadyMinted);
//     if (alreadyMinted)
//       throw new AppError("Address has already minted a certificate", 400);

//     const tx = await deployedContract.mint(attendee, merkleProof, {
//       from: relayerWallet.address,
//     });

//     console.log("tx", tx);

//     await tx.wait();

//     return tx.hash;
//   } catch (error) {
//     throw new AppError(error.message, 500);
//   }
// }
async function mintNFT(attendee, merkleProof) {
  try {
    console.log("=== Debugging Mint Process ===");
    console.log("Attendee:", attendee);
    console.log("Merkle Proof:", merkleProof);

    // Check if minting has started - Convert BigInt to Number for comparison
    const mintStartTime = await deployedContract.mintStartTime();
    const currentTime = Math.floor(Date.now() / 1000);

    console.log("Mint start time (BigInt):", mintStartTime.toString());
    console.log(
      "Mint start time (Date):",
      new Date(Number(mintStartTime) * 1000)
    );
    console.log("Current time:", new Date(currentTime * 1000));
    console.log("Can mint now:", currentTime >= Number(mintStartTime));

    if (currentTime < Number(mintStartTime)) {
      throw new AppError("Minting has not started yet", 400);
    }

    // Check if already minted
    const alreadyMinted = await deployedContract.hasMinted(attendee);
    console.log("Already minted:", alreadyMinted);

    if (alreadyMinted) {
      throw new AppError("Address has already minted a certificate", 400);
    }

    // Get the merkle root from contract to verify off-chain
    const contractMerkleRoot = await deployedContract.merkleRoot();
    console.log("Contract Merkle Root:", contractMerkleRoot);

    console.log(
      "local merkel",
      "0xd7af50e0c5e031e8e9724e2dd2fac90ca172fe37614309ec5a646277677300f3"
    );

    // Try to estimate gas first to catch errors
    console.log("Estimating gas...");
    try {
      const gasEstimate = await deployedContract.mint.estimateGas(
        attendee,
        merkleProof,
        { from: relayerWallet.address }
      );
      console.log("Gas estimate:", gasEstimate.toString());
    } catch (estimateError) {
      console.error("Gas estimation failed:", estimateError.message);
      throw new AppError(
        "Invalid mint parameters - likely invalid merkle proof",
        400
      );
    }

    // Execute the transaction
    console.log("Sending transaction...");
    const tx = await deployedContract.mint(attendee, merkleProof, {
      from: relayerWallet.address,
      gasLimit: 200000, // Add explicit gas limit to avoid estimation issues
    });

    console.log("Transaction sent:", tx.hash);

    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt.transactionHash);

    return tx.hash;
  } catch (error) {
    console.error("Minting error details:", {
      errorMessage: error.message,
      errorCode: error.code,
      errorData: error.data,
    });

    if (
      error.message.includes("Invalid merkle proof") ||
      error.message.includes("Merkle")
    ) {
      throw new AppError("Invalid merkle proof - not authorized to mint", 400);
    } else if (error.message.includes("Minting not started")) {
      throw new AppError("Minting period has not started yet", 400);
    } else if (error.message.includes("Already minted")) {
      throw new AppError("Address has already minted a certificate", 400);
    } else if (error.message.includes("estimateGas")) {
      throw new AppError("Invalid mint parameters - check merkle proof", 400);
    }

    throw new AppError(error.message, 500);
  }
}

module.exports = mintNFT;
