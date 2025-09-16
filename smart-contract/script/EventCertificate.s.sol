// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "..//src/EventCertificate.sol";

/// @title Deploy EventCertificate
/// @author Obinna Franklin Duru
/// @notice A script to deploy the EventCertificate contract.
/// Reads configuration from files instead of hardcoded values.
contract DeployEventCertificate is Script {
    // --- Configuration File Paths ---
    string constant MERKLE_ROOT_FILE = "./deployConfig/merkleRoot.txt";
    string constant JSON_CID_FILE = "./deployConfig/jsonCID.txt";
    string constant RELAYER_ADDRESS_FILE = "./deployConfig/relayerAddress.txt";
    string constant MINT_DELAY_FILE = "./deployConfig/mintDelay.txt";

    /// @notice Deploys the EventCertificate contract.
    /// @dev Reads all configuration from files and the deployer's private key from .env
    function run() external returns (EventCertificate) {
        // --- Load Deployment Configuration ---
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        if (deployerPrivateKey == 0) {
            revert("DEPLOYER_PRIVATE_KEY not set in .env file");
        }

        // --- Read Configuration from Files ---
        // Read Merkle Root
        bytes32 merkleRoot = bytes32(vm.parseBytes32(vm.readFile(MERKLE_ROOT_FILE)));
        if (merkleRoot == bytes32(0)) {
            revert("Failed to read merkleRoot.txt");
        }

        // Read JSON CID
        string memory jsonCID = vm.readLine(JSON_CID_FILE);
        if (bytes(jsonCID).length == 0) {
            revert("Failed to read jsonCID.txt");
        }
        string memory baseURI = string.concat("https://ipfs.io/ipfs/", jsonCID, "/");

        // Read Relayer Address
        address relayerAddress = vm.parseAddress(vm.readLine(RELAYER_ADDRESS_FILE));
        if (relayerAddress == address(0)) {
            revert("Failed to read relayerAddress.txt");
        }

        // Read Mint Delay (optional)
        uint256 mintDelaySeconds = 5; // default
        if (vm.exists(MINT_DELAY_FILE)) {
            mintDelaySeconds = vm.parseUint(vm.readLine(MINT_DELAY_FILE));
        }

        // --- Calculate Dynamic Constructor Arguments ---
        uint256 mintStartTime = block.timestamp + mintDelaySeconds;

        // --- Deploy the Contract ---
        vm.startBroadcast(deployerPrivateKey);
        EventCertificate certificateContract =
            new EventCertificate(baseURI, relayerAddress, mintStartTime, merkleRoot);
        vm.stopBroadcast();

        // --- Log Deployment Information ---
        console.log("==================================");
        console.log("EventCertificate Deployed!");
        console.log("  - Address:", address(certificateContract));
        console.log("  - Base URI:", baseURI);
        console.log("  - Relayer:", relayerAddress);
        console.log("  - Mint Start Time (Unix):", certificateContract.mintStartTime());
        console.log("  - Mint Delay (seconds):", mintDelaySeconds);
        console.log("  - Merkle Root:", vm.toString(certificateContract.merkleRoot()));
        console.log("==================================");

        return certificateContract;
    }
}