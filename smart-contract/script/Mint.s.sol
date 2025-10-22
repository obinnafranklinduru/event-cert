// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {EventCertificate} from "../src/EventCertificate.sol";

/// @title MintCertificateScript
/// @notice A script for the relayer to mint a certificate for a single whitelisted attendee.
/// @dev Reads all necessary parameters from the .env file, including the Merkle proof.
contract MintCertificateScript is Script {
    function run() external {
        // --- Load Configuration from .env ---
        uint256 relayerPrivateKey = vm.envUint("RELAYER_PRIVATE_KEY");
        if (relayerPrivateKey == 0) revert("RELAYER_PRIVATE_KEY not set in .env");

        address contractAddress = vm.envAddress("CERTIFICATE_CONTRACT_ADDRESS");
        if (contractAddress == address(0)) revert("CERTIFICATE_CONTRACT_ADDRESS not set in .env");

        uint256 campaignId = vm.envUint("CAMPAIGN_ID");
        address attendeeAddress = vm.envAddress("ATTENDEE_ADDRESS");

        // COMPATIBILITY FIX: Read the proof as a JSON string.
        string memory merkleProofJson = vm.envString("MERKLE_PROOF_JSON");

        if (attendeeAddress == address(0)) revert("ATTENDEE_ADDRESS not set in .env");
        if (bytes(merkleProofJson).length == 0) revert("MERKLE_PROOF_JSON not set or is empty in .env");

        bytes memory decodedProof = vm.parseJson(merkleProofJson);
        bytes32[] memory merkleProof = abi.decode(decodedProof, (bytes32[]));


        // --- Interact with Contract ---
        EventCertificate certificate = EventCertificate(payable(contractAddress));

        // --- TIME MANIPULATION (FIX) ---
        // Fetch the campaign's start time directly from the contract.
        EventCertificate.MintingCampaign memory campaign = certificate.getCampaign(campaignId);
        if (campaign.startTime == 0) revert("Campaign does not exist or has not been set up.");

        // Use vm.warp to fast-forward the blockchain's time to be inside the minting window.
        // We set it to 1 second after the start time to be safely within the window.
        uint256 warpTargetTime = campaign.startTime + 1;
        vm.warp(warpTargetTime);
        
        console.log("Time warped to match campaign window.");
        console.log("  - Warped Timestamp:", warpTargetTime);


        console.log("Attempting to mint certificate...");
        console.log("  - Contract:", contractAddress);
        console.log("  - Campaign ID:", campaignId);
        console.log("  - Attendee:", attendeeAddress);
        console.log("  - Submitting from Relayer:", vm.addr(relayerPrivateKey));

        uint256 nextTokenId = certificate.nextTokenId();

        vm.startBroadcast(relayerPrivateKey);
        certificate.mint(attendeeAddress, campaignId, merkleProof);
        vm.stopBroadcast();

        // --- Log Success Info ---
        console.log("==================================");
        console.log("Certificate Minted Successfully!");
        console.log("  - Attendee:", attendeeAddress);
        console.log("  - New Token ID:", nextTokenId);
        console.log("  - Owner of Token:", certificate.ownerOf(nextTokenId));
        console.log("==================================");
    }
}

