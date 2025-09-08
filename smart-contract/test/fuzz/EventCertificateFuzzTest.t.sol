// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/EventCertificate.sol";
import {MerkleProofLib} from "solady/utils/MerkleProofLib.sol";

/// @title EventCertificateFuzzTest
/// @notice Tests how the contract behaves with a wide range of random inputs
/// to uncover edge cases and uphold invariants.
contract EventCertificateFuzzTest is Test {
    EventCertificate internal certificateContract;

    // --- Fuzzing Actors and Data ---
    address internal owner = makeAddr("owner");
    address internal relayer = makeAddr("relayer");

    // We'll create a larger whitelist for fuzz testing.
    uint256 internal constant WHITELIST_SIZE = 10;
    address[] internal whitelist;
    bytes32[] internal leaves;
    bytes32 internal merkleRoot;

    function setUp() public {
        // Create a whitelist of 10 known addresses.
        for (uint256 i = 0; i < WHITELIST_SIZE; i++) {
            whitelist.push(makeAddr(string(abi.encodePacked("user", toString(i)))));
        }

        // Generate Merkle tree from the whitelist.
        leaves = new bytes32[](WHITELIST_SIZE);
        for (uint256 i = 0; i < WHITELIST_SIZE; i++) {
            leaves[i] = keccak256(abi.encodePacked(whitelist[i]));
        }
        merkleRoot = MerkleProofLib.getMerkleRoot(leaves);

        // Deploy contract.
        vm.prank(owner);
        certificateContract = new EventCertificate(
            "ipfs://CID/",
            relayer,
            block.timestamp, // Minting is active immediately.
            merkleRoot
        );
    }

    /// @notice Fuzz test for the mint function.
    /// @param attendee The address to try and mint for, provided by the fuzzer.
    /// @dev This test checks two main properties (invariants):
    /// 1. If an address IS whitelisted, it can mint exactly once.
    /// 2. If an address IS NOT whitelisted, it can never mint.
    function fuzz_MintInvariants(address attendee) public {
        // Ensure the fuzzer doesn't provide an address that would break test logic.
        vm.assume(attendee != address(0) && attendee != owner && attendee != relayer);

        // Check if the fuzzer-provided 'attendee' is on our pre-defined whitelist.
        bool isWhitelisted = false;
        uint256 whitelistedIndex = 0;
        for (uint256 i = 0; i < WHITELIST_SIZE; i++) {
            if (whitelist[i] == attendee) {
                isWhitelisted = true;
                whitelistedIndex = i;
                break;
            }
        }

        vm.prank(relayer);

        if (isWhitelisted) {
            // If the user IS whitelisted, the first mint should succeed.
            bytes32[] memory proof = MerkleProofLib.getMerkleProof(leaves, whitelistedIndex);
            uint256 nextId = certificateContract.nextTokenId();

            certificateContract.mint(attendee, proof);

            // Assert that state changed correctly.
            assertEq(certificateContract.ownerOf(nextId), attendee);
            assertTrue(certificateContract.hasMinted(attendee));

            // The second mint for the same user MUST fail.
            vm.expectRevert(EventCertificate.AlreadyMinted.selector);
            certificateContract.mint(attendee, proof);
        } else {
            // If the user IS NOT whitelisted, any attempt to mint must fail.
            // We provide an empty proof, as we don't have a valid one.
            bytes32[] memory emptyProof;
            vm.expectRevert(EventCertificate.InvalidProof.selector);
            certificateContract.mint(attendee, emptyProof);
        }
    }
}
