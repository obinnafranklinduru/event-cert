// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test, console} from "forge-std/Test.sol";
import {EventCertificate} from "../../src/EventCertificate.sol";
import {Merkle} from "murky/Merkle.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

/// @title EventCertificateUnitTest
/// @notice Unit tests for the EventCertificate contract.
/// @dev Each test focuses on a single requirement or revert condition.
contract EventCertificateUnitTest is Test {
    // --- State Variables ---
    EventCertificate internal cert;
    Merkle internal merkleTree;

    // --- Actors ---
    address internal owner = makeAddr("owner");
    address internal relayer = makeAddr("relayer");
    address internal alice = makeAddr("alice"); // Whitelisted
    address internal bob = makeAddr("bob"); // Whitelisted
    address internal charlie = makeAddr("charlie"); // Not whitelisted
    address internal pendingOwner = makeAddr("pendingOwner");

    // --- Campaign & Merkle Data ---
    uint256 public constant CAMPAIGN_ID = 1;
    uint256 internal constant MAX_MINTS = 500;
    bytes32 internal merkleRoot;
    bytes32[] internal proofForAlice;

    // --- Setup ---
    function setUp() public {
        vm.startPrank(owner);
        cert = new EventCertificate("TestCert", "TC", relayer);
        vm.stopPrank();

        // Create a standard whitelist for tests
        bytes32[] memory leaves = new bytes32[](2);
        leaves[0] = keccak256(abi.encodePacked(alice));
        leaves[1] = keccak256(abi.encodePacked(bob));

        merkleTree = new Merkle();
        merkleRoot = merkleTree.getRoot(leaves);
        proofForAlice = merkleTree.getProof(leaves, 0);
    }

    // --- Helper to create a valid campaign ---
    function _createValidCampaign() internal {
        uint256 startTime = block.timestamp + 1 hours;
        uint256 endTime = startTime + 24 hours;
        vm.prank(owner);
        cert.createCampaign(merkleRoot, startTime, endTime, MAX_MINTS, "ipfs://cid/");
    }

    // ===============================================
    //           Campaign Management Tests
    // ===============================================

    function test_createCampaign_succeedsWithValidParams() public {
        uint256 startTime = block.timestamp + 1 hours;
        uint256 endTime = startTime + 24 hours;

        vm.prank(owner);
        cert.createCampaign(merkleRoot, startTime, endTime, MAX_MINTS, "ipfs://cid/");

        EventCertificate.MintingCampaign memory campaign = cert.getCampaign(CAMPAIGN_ID);
        assertEq(campaign.merkleRoot, merkleRoot);
        assertEq(campaign.startTime, startTime);
        assertEq(campaign.endTime, endTime);
        assertEq(campaign.maxMints, MAX_MINTS);
        assertFalse(campaign.isActive);
    }

    function test_createCampaign_revertsForPastStartTime() public {
        vm.prank(owner);
        vm.expectRevert(EventCertificate.CampaignMustStartInFuture.selector);
        cert.createCampaign(merkleRoot, block.timestamp - 1, block.timestamp + 1, MAX_MINTS, "ipfs://cid/");
    }

    function test_createCampaign_revertsForStartAfterEndTime() public {
        vm.prank(owner);
        uint256 startTime = block.timestamp + 2 hours;
        uint256 endTime = startTime - 1 hours;
        vm.expectRevert(EventCertificate.InvalidCampaignTimes.selector);
        cert.createCampaign(merkleRoot, startTime, endTime, MAX_MINTS, "ipfs://cid/");
    }

    function test_createCampaign_revertsForDurationTooLong() public {
        vm.prank(owner);
        uint256 startTime = block.timestamp + 1 hours;
        uint256 endTime = startTime + 366 days; // Exceeds MAX_CAMPAIGN_DURATION
        vm.expectRevert(EventCertificate.CampaignDurationTooLong.selector);
        cert.createCampaign(merkleRoot, startTime, endTime, MAX_MINTS, "ipfs://cid/");
    }

    function test_createCampaign_revertsForEmptyMerkleRoot() public {
        vm.prank(owner);
        vm.expectRevert(EventCertificate.EmptyMerkleRoot.selector);
        cert.createCampaign(bytes32(0), block.timestamp + 1, block.timestamp + 2, MAX_MINTS, "ipfs://cid/");
    }

    function test_updateCampaign_succeedsBeforeStart() public {
        _createValidCampaign();
        bytes32 newRoot = keccak256("new");
        uint256 newStart = block.timestamp + 2 hours;
        uint256 newEnd = newStart + 1 hours;

        vm.prank(owner);
        cert.updateCampaignBeforeStart(CAMPAIGN_ID, newRoot, newStart, newEnd);

        EventCertificate.MintingCampaign memory campaign = cert.getCampaign(CAMPAIGN_ID);
        assertEq(campaign.merkleRoot, newRoot);
        assertEq(campaign.startTime, newStart);
    }

    function test_updateCampaign_revertsAfterStart() public {
        _createValidCampaign();
        uint256 startTime = cert.getCampaign(CAMPAIGN_ID).startTime;
        vm.warp(startTime); // Move time to the campaign start time

        vm.prank(owner);
        vm.expectRevert(EventCertificate.CannotModifyStartedCampaign.selector);
        cert.updateCampaignBeforeStart(CAMPAIGN_ID, bytes32(0), startTime + 1, startTime + 2);
    }

    function test_setCampaignActiveStatus_revertsAfterEndTime() public {
        _createValidCampaign();
        uint256 endTime = cert.getCampaign(CAMPAIGN_ID).endTime;
        vm.warp(endTime + 1); // Move time past the end

        vm.prank(owner);
        vm.expectRevert(EventCertificate.CampaignExpired.selector);
        cert.setCampaignActiveStatus(CAMPAIGN_ID, true);
    }

    // ===============================================
    //                 Minting Tests
    // ===============================================

    function test_mint_succeeds() public {
        _createValidCampaign();
        EventCertificate.MintingCampaign memory campaign = cert.getCampaign(CAMPAIGN_ID);
        vm.warp(campaign.startTime); // Go to start time

        vm.prank(owner);
        cert.setCampaignActiveStatus(CAMPAIGN_ID, true);

        vm.prank(relayer);
        cert.mint(alice, CAMPAIGN_ID, proofForAlice);

        assertEq(cert.ownerOf(1), alice);
        assertTrue(cert.hasMintedInCampaign(CAMPAIGN_ID, alice));

         string memory expected = string.concat(
            "ipfs://cid/",
            _toAsciiString(alice),
            ".json"
        );

        assertEq(cert.tokenURI(1), expected);
    }

    function test_mint_revertsIfMintedTwice() public {
        _createValidCampaign();
        EventCertificate.MintingCampaign memory campaign = cert.getCampaign(CAMPAIGN_ID);
        vm.warp(campaign.startTime);

        vm.prank(owner);
        cert.setCampaignActiveStatus(CAMPAIGN_ID, true);

        vm.prank(relayer);
        cert.mint(alice, CAMPAIGN_ID, proofForAlice);

        vm.prank(relayer);
        vm.expectRevert(EventCertificate.AlreadyMinted.selector);
        cert.mint(alice, CAMPAIGN_ID, proofForAlice);
    }

    function test_mint_revertsForInvalidProof() public {
        _createValidCampaign();
        EventCertificate.MintingCampaign memory campaign = cert.getCampaign(CAMPAIGN_ID);
        vm.warp(campaign.startTime);

        vm.prank(owner);
        cert.setCampaignActiveStatus(CAMPAIGN_ID, true);

        bytes32[] memory emptyProof;
        vm.prank(relayer);
        vm.expectRevert(EventCertificate.InvalidProof.selector);
        cert.mint(charlie, CAMPAIGN_ID, emptyProof);
    }

    function test_mint_revertsOutsideTimeWindow() public {
        _createValidCampaign();
        EventCertificate.MintingCampaign memory campaign = cert.getCampaign(CAMPAIGN_ID);
        vm.warp(campaign.startTime);

        vm.prank(owner);
        cert.setCampaignActiveStatus(CAMPAIGN_ID, true);

        vm.warp(campaign.startTime - 1);

        vm.prank(relayer);
        vm.expectRevert(EventCertificate.MintingWindowNotOpen.selector);
        cert.mint(alice, CAMPAIGN_ID, proofForAlice);
    }

    function test_mint_revertsIfCampaignInactive() public {
        _createValidCampaign();
        // Don't activate the campaign
        vm.prank(relayer);
        vm.expectRevert(EventCertificate.CampaignNotActive.selector);
        cert.mint(alice, CAMPAIGN_ID, proofForAlice);
    }

    function test_mint_revertsAtMaxMints() public {
        // --- Prepare Merkle tree ---
        bytes32[] memory leaves = new bytes32[](2);
        leaves[0] = keccak256(abi.encodePacked(alice));
        leaves[1] = keccak256(abi.encodePacked(bob));

        bytes32 merkleRootLocal = merkleTree.getRoot(leaves);
        bytes32[] memory proofForAliceLocal = merkleTree.getProof(leaves, 0);
        bytes32[] memory proofForBobLocal = merkleTree.getProof(leaves, 1);

        // --- Create campaign ---
        uint256 startTime = block.timestamp + 1 hours;
        uint256 endTime = startTime + 24 hours;

        vm.prank(owner);
        cert.createCampaign(merkleRootLocal, startTime, endTime, 1, "ipfs://cid/");

        // Warp to start time (so campaign is within minting window)
        vm.warp(startTime);

        // Now activate campaign
        vm.prank(owner);
        cert.setCampaignActiveStatus(CAMPAIGN_ID, true);

        // --- Mint for Alice (allowed) ---
        vm.prank(relayer);
        cert.mint(alice, CAMPAIGN_ID, proofForAliceLocal);

        // --- Mint for Bob (should revert due to maxMints = 1) ---
        vm.prank(relayer);
        vm.expectRevert(EventCertificate.MintLimitReached.selector);
        cert.mint(bob, CAMPAIGN_ID, proofForBobLocal);
    }

    function test_mint_revertsForZeroAddress() public {
        _createValidCampaign();
        vm.prank(relayer);
        vm.expectRevert(EventCertificate.ZeroAddress.selector);
        cert.mint(address(0), CAMPAIGN_ID, proofForAlice);
    }

    function test_mint_revertsForProofTooLong() public {
        _createValidCampaign();
        bytes32[] memory longProof = new bytes32[](501);
        vm.prank(relayer);
        vm.expectRevert(EventCertificate.ProofTooLong.selector);
        cert.mint(alice, CAMPAIGN_ID, longProof);
    }

    function test_mint_revertsIfNotRelayer() public {
        _createValidCampaign();
        vm.prank(owner); // Not the relayer
        vm.expectRevert(EventCertificate.NotAuthorizedRelayer.selector);
        cert.mint(alice, CAMPAIGN_ID, proofForAlice);
    }

    // ===============================================
    //              Soulbound & Admin Tests
    // ===============================================

    function test_soulbound_cannotTransfer() public {
        test_mint_succeeds(); // Mints token 1 to Alice
        vm.prank(alice);
        vm.expectRevert(EventCertificate.NonTransferable.selector);
        cert.transferFrom(alice, bob, 1);
    }

    function test_admin_pauseAndUnpause() public {
        _createValidCampaign();
        vm.warp(cert.getCampaign(CAMPAIGN_ID).startTime);
        vm.prank(owner);
        cert.setCampaignActiveStatus(CAMPAIGN_ID, true);

        // Pause the contract
        vm.prank(owner);
        cert.pause();

        // Minting should fail
        vm.prank(relayer);
        vm.expectRevert();
        cert.mint(alice, CAMPAIGN_ID, proofForAlice);

        // Unpause the contract
        vm.prank(owner);
        cert.unpause();

        // Minting should succeed now
        vm.prank(relayer);
        cert.mint(alice, CAMPAIGN_ID, proofForAlice);
        assertEq(cert.ownerOf(1), alice);
    }
    
    function test_admin_ownershipTransfer2Step() public {
        vm.prank(owner);
        cert.transferOwnership(pendingOwner);
        assertEq(cert.pendingOwner(), pendingOwner);

        vm.prank(pendingOwner);
        cert.acceptOwnership();

        assertEq(cert.owner(), pendingOwner);
        assertEq(cert.pendingOwner(), address(0));
    }

    // function test_tokenURI_succeedsWithOwnerAddress() public {
    //      _createValidCampaign();

    //     // Activate and warp
    //     vm.warp(startTime);
    //     vm.prank(owner);
    //     cert.setCampaignActiveStatus(CAMPAIGN_ID, true);

    //     // Mint
    //     vm.prank(relayer);
    //     cert.mint(alice, CAMPAIGN_ID, proofForAlice);

    //     string memory expected = string.concat(
    //         "ipfs://cid/",
    //         _toAsciiString(alice),
    //         ".json"
    //     );

    //     assertEq(cert.tokenURI(1), expected);
    // }

    // --- Helper ---
    function _toAsciiString(address addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }
}
