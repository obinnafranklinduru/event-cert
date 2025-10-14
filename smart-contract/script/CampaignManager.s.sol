// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {EventCertificate} from "../src/EventCertificate.sol";

/// @title CampaignManager
/// @notice A multi-purpose script to manage campaigns on a deployed EventCertificate contract.
/// @dev Use command-line arguments to specify the action (create, update, activate, delete).
contract CampaignManager is Script {
    EventCertificate internal cert;

    function setUp() public {
        // Load the deployed contract address from .env
        address contractAddress = vm.envAddress("CERTIFICATE_CONTRACT_ADDRESS");
        if (contractAddress == address(0)) revert("CERTIFICATE_CONTRACT_ADDRESS not set");
        cert = EventCertificate(contractAddress);
    }

    /// @notice Main entry point for the script.
    /// @param command The action to perform: "create", "update", "activate", "delete".
    function run(string memory command) external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        if (deployerPrivateKey == 0) revert("DEPLOYER_PRIVATE_KEY not set");

        vm.startBroadcast(deployerPrivateKey);

        if (keccak256(abi.encodePacked(command)) == keccak256("create")) {
            _createCampaign();
        } else if (keccak256(abi.encodePacked(command)) == keccak256("update")) {
            _updateCampaign();
        } else if (keccak256(abi.encodePacked(command)) == keccak256("activate")) {
            _setCampaignActiveStatus();
        } else if (keccak256(abi.encodePacked(command)) == keccak256("delete")) {
            _deleteCampaign();
        } else {
            revert("Invalid command. Use 'create', 'update', 'activate', or 'delete'.");
        }

        vm.stopBroadcast();
    }

    function _createCampaign() internal {
        uint256 campaignId = vm.envUint("CAMPAIGN_ID");
        bytes32 merkleRoot = vm.envBytes32("MERKLE_ROOT");
        uint256 startTime = vm.envUint("START_TIME");
        uint256 endTime = vm.envUint("END_TIME");
        uint256 maxMints = vm.envUint("MAX_MINTS");

        console.log("Creating Campaign #%s...", campaignId);
        cert.createCampaign(campaignId, merkleRoot, startTime, endTime, maxMints);
        console.log("Campaign created successfully.");
    }

    function _updateCampaign() internal {
        uint256 campaignId = vm.envUint("CAMPAIGN_ID");
        bytes32 newMerkleRoot = vm.envBytes32("MERKLE_ROOT");
        uint256 newStartTime = vm.envUint("START_TIME");
        uint256 newEndTime = vm.envUint("END_TIME");

        console.log("Updating Campaign #%s...", campaignId);
        cert.updateCampaignBeforeStart(campaignId, newMerkleRoot, newStartTime, newEndTime);
        console.log("Campaign updated successfully.");
    }

    function _setCampaignActiveStatus() internal {
        uint256 campaignId = vm.envUint("CAMPAIGN_ID");
        bool isActive = vm.envBool("IS_ACTIVE");

        console.log("Setting Campaign #%s active status to: %s", campaignId, isActive);
        cert.setCampaignActiveStatus(campaignId, isActive);
        console.log("Campaign status updated successfully.");
    }

    function _deleteCampaign() internal {
        uint256 campaignId = vm.envUint("CAMPAIGN_ID");
        console.log("Deleting Campaign #%s...", campaignId);
        cert.deleteCampaign(campaignId);
        console.log("Campaign deleted successfully.");
    }
}
