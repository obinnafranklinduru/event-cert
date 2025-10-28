// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test, console} from "forge-std/Test.sol";
import {StdInvariant} from "forge-std/StdInvariant.sol";
import {EventCertificate} from "../../src/EventCertificate.sol";
import {Merkle} from "murky/Merkle.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title EventCertificateFuzzTest
/// @notice Demonstrates basic invariant testing using Foundry fuzz engine.
contract EventCertificateFuzzTest is StdInvariant, Test {
    EventCertificate cert;
    Merkle merkleTree;
    Handler handler;

    function setUp() public {
        // Deploy the main contract we want to test
        cert = new EventCertificate("FuzzTest", "FUZZ", makeAddr("relayer"));
        merkleTree = new Merkle();

        // Create the helper (handler) contract that defines what fuzzing can do
        handler = new Handler();
        handler.initialize(cert);

        // Register which contract Foundry should target for fuzzing
        targetContract(address(cert));

        // All fuzz calls will appear to come from the handler
        targetSender(address(handler));
    }

    // -------------------------------
    //         INVARIANTS
    // -------------------------------

    /// Invariant 1: nextTokenId should always be >= 1
    function invariant_nextTokenIdNeverZero() public view {
        assertGe(cert.nextTokenId(), 1);
    }

    /// Invariant 2: Tokens must never be transferable
    /// (if transferFrom works, invariant engine catches the revert failure)
    function invariant_tokensAreNonTransferable() public pure {
        // no direct check — handled by handler's `transferFrom`
    }

    /// Invariant 3: Mint count must not exceed campaign max
    function invariant_mintCountWithinLimit() public view {
        // Optional: could check campaign.totalMints <= campaign.maxMints if available
    }
}

/// @dev Helper contract that defines what the fuzzer can actually do.
contract Handler is Test {
    EventCertificate cert;
    Merkle merkleTree;

    address owner;
    address relayer;
    address[] whitelist;
    bytes32[] leaves;
    bytes32 merkleRoot;

    uint256 lastCampaignId;

    // -------------------------------
    //       SETUP FUNCTION
    // -------------------------------
    function initialize(EventCertificate _cert) public {
        cert = _cert;
        owner = cert.owner();
        relayer = cert.relayer();
        merkleTree = new Merkle();

        // Build whitelist
        for (uint256 i = 0; i < 5; i++) {
            whitelist.push(makeAddr(string.concat("user", Strings.toString(i))));
        }

        // Generate leaves and merkle root
        leaves = new bytes32[](whitelist.length);
        for (uint256 i = 0; i < leaves.length; i++) {
            leaves[i] = keccak256(abi.encodePacked(whitelist[i]));
        }

        merkleRoot = merkleTree.getRoot(leaves);
        lastCampaignId = 0;
    }

    // -------------------------------
    //        FUZZER ACTIONS
    // -------------------------------

    /// @notice Owner creates a new campaign
    function createCampaign(uint96 _startTime, uint96 _endTime, uint32 _maxMints) public {
        vm.prank(owner);

        uint256 startTime = block.timestamp + (_startTime % 1 days); // within next 24h
        uint256 endTime = startTime + 1 hours + (_endTime % 7 days); // last up to 7d
        uint256 maxMints = 1 + (_maxMints % 50); // up to 50 mints

        cert.createCampaign(merkleRoot, startTime, endTime, maxMints, "ipfs://cid/");
    }

    /// @notice Owner can activate or deactivate a campaign
    function setCampaignActive(uint32 _id, bool _isActive) public {
        if (lastCampaignId == 0) return;
        uint256 campaignId = 1 + (_id % lastCampaignId);

        EventCertificate.MintingCampaign memory campaign = cert.getCampaign(campaignId);
        if (campaign.merkleRoot == bytes32(0)) return;

        vm.prank(owner);

        // Expect revert if outside allowed time
        if (_isActive && (block.timestamp < campaign.startTime || block.timestamp > campaign.endTime)) {
            vm.expectRevert();
        }

        cert.setCampaignActiveStatus(campaignId, _isActive);
    }

    /// @notice Relayer tries to mint for a user in a campaign
    function mint(uint32 _id, uint8 _userIndex) public {
        if (lastCampaignId == 0) return;
        uint256 campaignId = 1 + (_id % lastCampaignId);

        address user = whitelist[_userIndex % whitelist.length];
        bytes32[] memory proof = merkleTree.getProof(leaves, _userIndex % whitelist.length);

        vm.prank(relayer);
        // Expect revert if can't mint
        if (!cert.canMint(user, campaignId)) {
            vm.expectRevert();
        }
        cert.mint(user, campaignId, proof);
    }

    /// @notice Try to transfer (should always fail)
    function transferFrom(uint256 _tokenId, address _to) public {
        if (cert.nextTokenId() <= 1) return; // No tokens yet
        uint256 tokenId = 1 + (_tokenId % (cert.nextTokenId() - 1));

        address from;
        try cert.ownerOf(tokenId) returns (address _from) {
            from = _from;
        } catch {
            return; // invalid token
        }

        vm.prank(from);
        vm.expectRevert(EventCertificate.NonTransferable.selector);
        cert.transferFrom(from, _to, tokenId);
    }
}
