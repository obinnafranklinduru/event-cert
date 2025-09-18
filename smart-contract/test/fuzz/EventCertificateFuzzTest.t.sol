// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {EventCertificate} from "../../src/EventCertificate.sol";
import {Merkle} from "murky/Merkle.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title EventCertificateFuzzTest
/// @notice Tests how the contract behaves with a wide range of random inputs
/// to uncover edge cases and uphold invariants.
contract EventCertificateFuzzTest is Test {
    EventCertificate internal certificateContract;
    Merkle internal merkleTree;

    // --- Fuzzing Actors and Data ---
    address internal owner = makeAddr("owner");
    address internal relayer = makeAddr("relayer");

    // We'll create a larger whitelist for fuzz testing.
    uint256 internal constant WHITELIST_SIZE = 2000;
    address[] internal whitelist;
    bytes32[] internal leaves;
    bytes32 internal merkleRoot;

    function setUp() public {
        merkleTree = new Merkle();

        // Create a whitelist of 10 known addresses.
        for (uint256 i = 0; i < WHITELIST_SIZE; i++) {
            whitelist.push(makeAddr(string.concat("user", Strings.toString(i))));
        }

        // Generate Merkle tree from the whitelist using Murky
        leaves = new bytes32[](WHITELIST_SIZE);
        for (uint256 i = 0; i < WHITELIST_SIZE; i++) {
            leaves[i] = keccak256(abi.encode(whitelist[i]));
        }
        merkleRoot = merkleTree.getRoot(leaves);

        // Deploy contract.
        vm.prank(owner);
        certificateContract =
            new EventCertificate("TEST CONTRACT", "TEST", "ipfs://CID/", relayer, block.timestamp, merkleRoot);
    }

    /// @notice Fuzz test for the mint function.
    /// @param attendee The address to try and mint for, provided by the fuzzer.
    /// @dev This test checks two main properties (invariants):
    /// 1. If an address IS whitelisted, it can mint exactly once.
    /// 2. If an address IS NOT whitelisted, it can never mint.
    function testFuzz_MintInvariants(address attendee) public {
        vm.assume(attendee != address(0) && attendee != owner && attendee != relayer);
        vm.assume(uint160(attendee) > 1000); // Skip very low addresses
        vm.assume(attendee.code.length == 0); // Only EOA addresses, not contracts

        bool isWhitelisted = false;
        uint256 whitelistedIndex = 0;
        for (uint256 i = 0; i < WHITELIST_SIZE; i++) {
            if (whitelist[i] == attendee) {
                isWhitelisted = true;
                whitelistedIndex = i;
                break;
            }
        }

        if (isWhitelisted) {
            bytes32[] memory proof = merkleTree.getProof(leaves, whitelistedIndex);
            uint256 nextId = certificateContract.nextTokenId();

            // Set prank BEFORE the mint call
            vm.prank(relayer);
            certificateContract.mint(attendee, proof);

            assertEq(certificateContract.ownerOf(nextId), attendee);
            assertTrue(certificateContract.hasMinted(attendee));

            // Set prank again BEFORE the second mint call
            vm.prank(relayer);
            vm.expectRevert(EventCertificate.AlreadyMinted.selector);
            certificateContract.mint(attendee, proof);
        } else {
            bytes32[] memory emptyProof;

            // Set prank BEFORE the mint call
            vm.prank(relayer);
            vm.expectRevert(EventCertificate.InvalidProof.selector);
            certificateContract.mint(attendee, emptyProof);
        }
    }
}
