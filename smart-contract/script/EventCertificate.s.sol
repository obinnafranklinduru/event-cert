// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "../src/EventCertificate.sol";

/// @title Deploy EventCertificate
/// @author Obinna Franklin Duru
/// @notice A script to deploy the EventCertificate contract.
/// All configuration values are read from the .env file.
contract DeployEventCertificate is Script {
    /// @notice Deploys the EventCertificate contract.
    function run() external returns (EventCertificate) {
        // --- Load Deployment Configuration from .env ---
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        if (deployerPrivateKey == 0) {
            revert("DEPLOYER_PRIVATE_KEY not set in .env file");
        }

        string memory name = vm.envString("NFT_NAME");
        string memory symbol = vm.envString("NFT_SYMBOL");

        bytes32 merkleRoot = vm.envBytes32("MERKLE_ROOT");
        if (merkleRoot == bytes32(0)) {
            revert("MERKLE_ROOT not set in .env file");
        }

        string memory jsonCID = vm.envString("JSON_CID");
        if (bytes(jsonCID).length == 0) {
            revert("JSON_CID not set in .env file");
        }
        string memory baseURI = string.concat("https://ipfs.io/ipfs/", jsonCID, "/");

        address relayerAddress = vm.envAddress("RELAYER_ADDRESS");
        if (relayerAddress == address(0)) {
            revert("RELAYER_ADDRESS not set in .env file");
        }

        uint256 mintDelaySeconds = vm.envOr("MINT_DELAY", uint256(5));

        // --- Calculate Mint Start Time ---
        uint256 mintStartTime = block.timestamp + mintDelaySeconds;

        // --- Deploy Contract ---
        vm.startBroadcast(deployerPrivateKey);
        EventCertificate certificateContract =
            new EventCertificate(name, symbol, baseURI, relayerAddress, mintStartTime, merkleRoot);
        vm.stopBroadcast();

        // --- Log Deployment Info ---
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
