// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/EventCertificate.sol";
import {MerkleProofLib} from "solady/utils/MerkleProofLib.sol";

/// @title EventCertificateIntegrationTest
/// @notice Tests the interactions between different functions and state changes over time,
/// simulating a more realistic user and admin journey.
contract EventCertificateIntegrationTest is Test {
    EventCertificate internal certificateContract;

    // --- Actors ---
    address internal owner = makeAddr("owner");
    address internal relayer = makeAddr("relayer");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    // --- Merkle Tree Data ---
    bytes32 internal merkleRoot;
    bytes32[] internal proofForAlice;
    bytes32[] internal proofForBob;

    function setUp() public {
        bytes32[] memory leaves = new bytes32[](2);
        leaves[0] = keccak256(abi.encodePacked(alice));
        leaves[1] = keccak256(abi.encodePacked(bob));

        merkleRoot = MerkleProofLib.getMerkleRoot(leaves);
        proofForAlice = MerkleProofLib.getMerkleProof(leaves, 0);
        proofForBob = MerkleProofLib.getMerkleProof(leaves, 1);

        vm.prank(owner);
        certificateContract = new EventCertificate(
            "ipfs://CID/",
            relayer,
            block.timestamp,
            merkleRoot
        );
    }

    /// @notice Tests a full lifecycle: initial mints, an admin update, and post-update interactions.
    function test_Integration_FullLifecycle() public {
        // 1. Alice (whitelisted) successfully mints her certificate (tokenId 1).
        vm.prank(relayer);
        certificateContract.mint(alice, proofForAlice);
        assertEq(certificateContract.ownerOf(1), alice, "Alice should own token 1");
        assertEq(certificateContract.nextTokenId(), 2, "Next token ID should be 2");

        // 2. Bob (whitelisted) successfully mints his certificate (tokenId 2).
        vm.prank(relayer);
        certificateContract.mint(bob, proofForBob);
        assertEq(certificateContract.ownerOf(2), bob, "Bob should own token 2");
        assertEq(certificateContract.nextTokenId(), 3, "Next token ID should be 3");

        // 3. Alice tries to transfer her soulbound token and fails.
        vm.prank(alice);
        vm.expectRevert(EventCertificate.NonTransferable.selector);
        certificateContract.transferFrom(alice, bob, 1);

        // 4. Owner updates the relayer address.
        address newRelayer = makeAddr("newRelayer");
        vm.prank(owner);
        certificateContract.updateRelayer(newRelayer);
        assertEq(certificateContract.relayer(), newRelayer, "Relayer address should be updated");

        // 5. The OLD relayer tries to mint and fails with the correct error.
        // We re-use Bob's data; the call should fail on NotAuthorizedRelayer before AlreadyMinted.
        vm.prank(relayer);
        vm.expectRevert(EventCertificate.NotAuthorizedRelayer.selector);
        certificateContract.mint(bob, proofForBob);

        // 6. Owner adds a new user (Eve) to the whitelist by updating the Merkle root.
        address eve = makeAddr("eve");
        bytes32[] memory newLeaves = new bytes32[](1);
        newLeaves[0] = keccak256(abi.encodePacked(eve));
        bytes32 newMerkleRoot = MerkleProofLib.getMerkleRoot(newLeaves);
        bytes32[] memory proofForEve = MerkleProofLib.getMerkleProof(newLeaves, 0);

        vm.prank(owner);
        certificateContract.updateMerkleRoot(newMerkleRoot);
        assertEq(certificateContract.merkleRoot(), newMerkleRoot, "Merkle root should be updated");

        // 7. The NEW relayer successfully mints for the newly whitelisted user (Eve).
        vm.prank(newRelayer);
        certificateContract.mint(eve, proofForEve);
        assertEq(certificateContract.ownerOf(3), eve, "Eve should own token 3");
        assertEq(certificateContract.nextTokenId(), 4, "Next token ID should be 4");
    }
}
