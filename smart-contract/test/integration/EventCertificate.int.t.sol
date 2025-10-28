// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test, console} from "forge-std/Test.sol";
import {EventCertificate} from "../../src/EventCertificate.sol";
import {Merkle} from "murky/Merkle.sol";

/// @title EventCertificateIntegrationTest
/// @notice Tests the full lifecycle and interaction between functions over multiple campaigns.
contract EventCertificateIntegrationTest is Test {
    // --- State ---
    EventCertificate internal cert;
    Merkle internal merkleTree;

    // --- Actors ---
    address internal owner = makeAddr("owner");
    address internal relayer = makeAddr("relayer");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal charlie = makeAddr("charlie");
    address internal diana = makeAddr("diana");

    function setUp() public {
        merkleTree = new Merkle();
    }

    /// @notice Simulates a realistic multi-campaign lifecycle.
    function test_Integration_MultiCampaignLifecycle() public {
        // =============================================================
        // 1. SETUP: Deploy the contract
        // =============================================================
        vm.startPrank(owner);
        cert = new EventCertificate("IntegrationTest", "INT", relayer);
        vm.stopPrank();
        assertEq(cert.owner(), owner);

        // =============================================================
        // 2. CAMPAIGN 1: "Tech Conference" (Alice & Bob are whitelisted)
        // =============================================================
        uint256 campaign1_id = 1;
        uint256 campaign1_startTime = block.timestamp + 1 days;
        uint256 campaign1_endTime = campaign1_startTime + 1 days;

        bytes32[] memory leaves1 = new bytes32[](2);
        leaves1[0] = keccak256(abi.encodePacked(alice));
        leaves1[1] = keccak256(abi.encodePacked(bob));
        bytes32 merkleRoot1 = merkleTree.getRoot(leaves1);
        bytes32[] memory proofForAlice1 = merkleTree.getProof(leaves1, 0);

        vm.startPrank(owner);
        cert.createCampaign(merkleRoot1, campaign1_startTime, campaign1_endTime, 100, "ipfs://cid/");
        vm.stopPrank();

        console.log("--- Campaign 1: Tech Conference Created ---");

        // Activate campaign at the start time
        vm.warp(campaign1_startTime);
        vm.prank(owner);
        cert.setCampaignActiveStatus(campaign1_id, true);
        assertTrue(cert.getCampaign(campaign1_id).isActive, "Campaign 1 should be active");

        // Mint within window for Alice
        vm.prank(relayer);
        cert.mint(alice, campaign1_id, proofForAlice1);
        assertEq(cert.ownerOf(1), alice);

        // Invalid proof for Charlie
        bytes32[] memory emptyProof = new bytes32[](0);
        vm.prank(relayer);
        vm.expectRevert(EventCertificate.InvalidProof.selector);
        cert.mint(charlie, campaign1_id, emptyProof);

        // Move past end time
        vm.warp(campaign1_endTime + 1);
        console.log("--- Campaign 1: Minting Window Closed ---");

        // Bob's attempt after end time fails
        bytes32[] memory proofForBob1 = merkleTree.getProof(leaves1, 1);
        vm.prank(relayer);
        vm.expectRevert(EventCertificate.MintingWindowNotOpen.selector);
        cert.mint(bob, campaign1_id, proofForBob1);

        // =============================================================
        // 3. CAMPAIGN 2: "Art Fair" (Charlie & Diana are whitelisted)
        // =============================================================
        uint256 campaign2_id = 2;
        uint256 campaign2_startTime = block.timestamp + 1 days;
        uint256 campaign2_endTime = campaign2_startTime + 2 days;

        // Create incorrect root first
        bytes32[] memory leaves2_wrong = new bytes32[](2);
        leaves2_wrong[0] = keccak256(abi.encodePacked(alice));
        leaves2_wrong[1] = keccak256(abi.encodePacked(address(0xdead)));
        bytes32 merkleRoot2_wrong = merkleTree.getRoot(leaves2_wrong);

        vm.prank(owner);
        cert.createCampaign(merkleRoot2_wrong, campaign2_startTime, campaign2_endTime, 50, "ipfs://cid/");

        // Correct root before start
        bytes32[] memory leaves2_correct = new bytes32[](2);
        leaves2_correct[0] = keccak256(abi.encodePacked(charlie));
        leaves2_correct[1] = keccak256(abi.encodePacked(diana));
        bytes32 merkleRoot2_correct = merkleTree.getRoot(leaves2_correct);

        vm.prank(owner);
        cert.updateCampaignBeforeStart(campaign2_id, merkleRoot2_correct, campaign2_startTime, campaign2_endTime);
        assertEq(cert.getCampaign(campaign2_id).merkleRoot, merkleRoot2_correct);

        console.log("--- Campaign 2: Art Fair Created & Corrected ---");

        // Activate Campaign 2
        vm.warp(campaign2_startTime);
        vm.prank(owner);
        cert.setCampaignActiveStatus(campaign2_id, true);

        // Pause and check revert
        vm.prank(owner);
        cert.pause();
        assertTrue(cert.paused());

        bytes32[] memory proofForCharlie2 = merkleTree.getProof(leaves2_correct, 0);
        vm.prank(relayer);
        vm.expectRevert();
        cert.mint(charlie, campaign2_id, proofForCharlie2);

        // Unpause
        vm.prank(owner);
        cert.unpause();

        vm.prank(relayer);
        cert.mint(charlie, campaign2_id, proofForCharlie2);
        assertEq(cert.ownerOf(2), charlie);

        // Bob fails for Campaign 2
        vm.prank(relayer);
        vm.expectRevert(EventCertificate.InvalidProof.selector);
        cert.mint(bob, campaign2_id, emptyProof);

        // Final assertions
        assertEq(cert.nextTokenId(), 3);
        assertTrue(cert.hasMintedInCampaign(1, alice));
        assertFalse(cert.hasMintedInCampaign(2, alice));
        assertFalse(cert.hasMintedInCampaign(1, bob));
        assertFalse(cert.hasMintedInCampaign(2, bob));
        assertFalse(cert.hasMintedInCampaign(1, charlie));
        assertTrue(cert.hasMintedInCampaign(2, charlie));

        console.log("--- Integration Test Completed Successfully ---");
    }
}
