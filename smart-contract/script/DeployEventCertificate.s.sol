// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {EventCertificate} from "../src/EventCertificate.sol";

/// @title DeployEventCertificate
/// @notice Deploys the main EventCertificate contract.
/// @dev Reads constructor arguments from the .env file.
contract DeployEventCertificate is Script {
    function run() external returns (EventCertificate) {
        // --- Load Deployment Configuration ---
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        if (deployerPrivateKey == 0) revert("DEPLOYER_PRIVATE_KEY not set");

        string memory name = vm.envString("NFT_NAME");
        string memory symbol = vm.envString("NFT_SYMBOL");
        string memory baseURI = vm.envString("BASE_URI");
        address relayerAddress = vm.envAddress("RELAYER_ADDRESS");

        if (bytes(name).length == 0) revert("NFT_NAME not set");
        if (bytes(symbol).length == 0) revert("NFT_SYMBOL not set");
        if (bytes(baseURI).length == 0) revert("BASE_URI not set");
        if (relayerAddress == address(0)) revert("RELAYER_ADDRESS not set");

        // --- Deploy Contract ---
        vm.startBroadcast(deployerPrivateKey);
        EventCertificate certificate = new EventCertificate(name, symbol, baseURI, relayerAddress);
        vm.stopBroadcast();

        // --- Log Deployment Info ---
        console.log("==================================");
        console.log("EventCertificate Deployed!");
        console.log("  - Address:", address(certificate));
        console.log("  - Owner:", certificate.owner());
        console.log("  - Relayer:", certificate.relayer());
        console.log("  - Base URI:", baseURI);
        console.log("==================================");

        return certificate;
    }
}
