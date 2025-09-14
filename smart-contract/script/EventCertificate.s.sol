// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "..//src/EventCertificate.sol";

/// @title Deploy EventCertificate
/// @author Obinna Franklin Duru
/// @notice A script to deploy the EventCertificate contract.
/// Reads configuration from environment variables and a merkle root from a file.
contract DeployEventCertificate is Script {
    // --- Configuration ---
    // These values should be configured before running the script.

    // The trusted relayer address that will pay gas for mints.
    address constant RELAYER_ADDRESS = address(0x7aC2494Eb7d6e507283c24EcE73cB736aDfb2b82);

    // The base URI pointing to your IPFS metadata folder."
    string constant BASE_URI = "https://ipfs.io/ipfs/QmcGo4zBspomrk4Moun4WRdjXmaB6Psp1qF4EPMaqHmH7F/";

    // How many seconds from the deployment time the minting window should open.
    uint256 constant MINT_DELAY_SECONDS = 5; //5 seconds from deployment time

    /// @notice Deploys the EventCertificate contract.
    /// @dev Reads the deployer's private key from the .env file and the Merkle Root from merkleRoot.txt.
    function run() external returns (EventCertificate) {
        // --- Load Deployment Configuration ---
        // Reads the private key for the deployer wallet from the .env file.
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        if (deployerPrivateKey == 0) {
            revert("DEPLOYER_PRIVATE_KEY not set in .env file");
        }

        // ---  Read Off-Chain Data ---
        // Reads the generated Merkle Root from the file system.
        // This file must be created by your `generate-merkle.js` script first.
        string memory merkleRootFromFile = vm.readFile("./merkleRoot.txt");
        bytes32 merkleRoot = bytes32(vm.parseBytes32(merkleRootFromFile));
        if (merkleRoot == bytes32(0)) {
            revert("Failed to read merkleRoot.txt or file is empty");
        }

        // ---  Calculate Dynamic Constructor Arguments ---
        // Set the minting start time based on the current block timestamp plus a delay.
        uint256 mintStartTime = block.timestamp + MINT_DELAY_SECONDS;

        // --- Deploy the Contract ---
        // Starts broadcasting transactions from the deployer's wallet.
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the contract with all the necessary arguments.
        EventCertificate certificateContract =
            new EventCertificate(BASE_URI, RELAYER_ADDRESS, mintStartTime, merkleRoot);

        // Stops broadcasting.
        vm.stopBroadcast();

        // --- 5. Log Deployment Information ---
        console.log("==================================");
        console.log("EventCertificate Deployed!");
        console.log("  - Address:", address(certificateContract));
        console.log("  - Relayer:", certificateContract.relayer());
        console.log("  - Mint Start Time (Unix):", certificateContract.mintStartTime());
        console.log("  - Merkle Root:", vm.toString(certificateContract.merkleRoot()));
        console.log("==================================");

        return certificateContract;
    }
}
