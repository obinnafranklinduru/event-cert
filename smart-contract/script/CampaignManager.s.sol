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
        uint256 maxMints = vm.envUint("MAX_MINTS");

        uint256 startTime = vm.envUint("CAMPAIGN_START_TIME");
        uint256 endTime = vm.envUint("CAMPAIGN_END_TIME");

        if (campaignId == 0) revert("CAMPAIGN_ID not set");
        if (merkleRoot == bytes32(0)) revert("MERKLE_ROOT not set");
        if (maxMints == 0) revert("MAX_MINTS not set");
        if (startTime == 0) revert("CAMPAIGN_START_TIME not set");
        if (endTime == 0) revert("CAMPAIGN_END_TIME not set");

        console.log("Creating Campaign #%s...", campaignId);
        console.log("Start Time: %s", startTime);
        console.log("End Time: %s", endTime);
        cert.createCampaign(campaignId, merkleRoot, startTime, endTime, maxMints);
        console.log("Sender (msg.sender):", msg.sender);
        console.log("Contract owner:", cert.owner());
        console.log("Campaign created successfully.");
    }

    function _updateCampaign() internal {
        uint256 campaignId = vm.envUint("CAMPAIGN_ID");
        bytes32 newMerkleRoot = vm.envBytes32("MERKLE_ROOT");

        uint256 newStartTime = vm.envUint("CAMPAIGN_START_TIME");
        uint256 newEndTime = vm.envUint("CAMPAIGN_END_TIME");

        if (campaignId == 0) revert("CAMPAIGN_ID not set");
        if (newMerkleRoot == bytes32(0)) revert("NEW_MERKLE_ROOT not set");
        if (newStartTime == 0) revert("CAMPAIGN_START_TIME not set");
        if (newEndTime == 0) revert("CAMPAIGN_END_TIME not set");

        console.log("Updating Campaign #%s...", campaignId);
        cert.updateCampaignBeforeStart(campaignId, newMerkleRoot, newStartTime, newEndTime);
        console.log("Campaign updated successfully.");
    }

    function _setCampaignActiveStatus() internal {
        uint256 campaignId = vm.envUint("CAMPAIGN_ID");
        bool isActive = vm.envBool("IS_ACTIVE");

        if (campaignId == 0) revert("CAMPAIGN_ID not set");
        if (isActive != true ) revert("IS_ACTIVE not set");

        console.log("Setting Campaign #%s active status to: %s", campaignId, isActive);
        cert.setCampaignActiveStatus(campaignId, isActive);
        console.log("Campaign status updated successfully.");
    }

    function _deleteCampaign() internal {
        uint256 campaignId = vm.envUint("CAMPAIGN_ID");
        if (campaignId == 0) revert("CAMPAIGN_ID not set");

        console.log("Deleting Campaign #%s...", campaignId);
        cert.deleteCampaign(campaignId);
        console.log("Campaign deleted successfully.");
    }
}
