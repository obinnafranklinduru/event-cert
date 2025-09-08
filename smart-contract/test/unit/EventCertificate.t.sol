// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/EventCertificate.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MerkleProofLib} from "solady/utils/MerkleProofLib.sol";

contract EventCertificateTest is Test {
    // --- State Variables ---
    EventCertificate internal certificateContract;

    // --- Actors ---
    address internal owner = makeAddr("owner");
    address internal relayer = makeAddr("relayer");
    address internal alice = makeAddr("alice"); // Whitelisted attendee
    address internal bob = makeAddr("bob");   // Whitelisted attendee
    address internal charlie = makeAddr("charlie"); // Not whitelisted

    // --- Merkle Tree Test Data ---
    bytes32[] internal proofForAlice;
    bytes32[] internal proofForBob;
    bytes32 internal merkleRoot;

    // --- Setup ---
    function setUp() public {
        // 1. Create a sample whitelist and Merkle tree using a library
        bytes32[] memory leaves = new bytes32[](2);
        leaves[0] = keccak256(abi.encodePacked(alice));
        leaves[1] = keccak256(abi.encodePacked(bob));

        merkleRoot = MerkleProofLib.getMerkleRoot(leaves);
        proofForAlice = MerkleProofLib.getMerkleProof(leaves, 0);
        proofForBob = MerkleProofLib.getMerkleProof(leaves, 1);

        // 2. Deploy the contract
        vm.prank(owner);
        certificateContract = new EventCertificate(
            "ipfs://CID/",
            relayer,
            block.timestamp,
            merkleRoot
        );
    }

    // --- Unit Tests ---

    // Test 1: Constructor sets initial state correctly
    function test_ConstructorSetsState() public {
        assertEq(certificateContract.owner(), owner);
        assertEq(certificateContract.relayer(), relayer);
        assertEq(certificateContract.merkleRoot(), merkleRoot);
        // Assuming contract starts _nextTokenId at 1
        assertEq(certificateContract.nextTokenId(), 1);
    }
    
    // Test 1.1: Constructor reverts if relayer is the zero address
    function test_Revert_Constructor_ZeroAddressRelayer() public {
        vm.prank(owner);
        vm.expectRevert(EventCertificate.ZeroAddress.selector);
        new EventCertificate("ipfs://CID/", address(0), block.timestamp, merkleRoot);
    }

    // Test 2: Successful mint
    function test_Mint_SucceedsForWhitelistedUser() public {
        uint256 expectedTokenId = 1;
        vm.prank(relayer);
        
        vm.expectEmit(true, true, true, true);
        emit EventCertificate.CertificateMinted(alice, expectedTokenId);

        certificateContract.mint(alice, proofForAlice);

        assertEq(certificateContract.ownerOf(expectedTokenId), alice);
        assertTrue(certificateContract.hasMinted(alice));
        assertEq(certificateContract.nextTokenId(), 2);
    }

    // Test 3: Mint reverts if called by a non-relayer
    function test_Revert_MintFromNonRelayer() public {
        vm.expectRevert(EventCertificate.NotAuthorizedRelayer.selector);
        vm.prank(alice);
        certificateContract.mint(alice, proofForAlice);
    }

    // Test 4: Mint reverts if attendee has already minted
    function test_Revert_AlreadyMinted() public {
        vm.prank(relayer);
        certificateContract.mint(alice, proofForAlice);
        vm.expectRevert(EventCertificate.AlreadyMinted.selector);
        vm.prank(relayer);
        certificateContract.mint(alice, proofForAlice);
    }
    
    // Test 8: Mint reverts if outside the minting window (too late)
    function test_Revert_MintingNotActive_TooLate() public {
        uint256 mintWindow = certificateContract.MINT_WINDOW();
        uint256 startTime = certificateContract.mintStartTime();
        // Fast-forward time to exactly 1 second past the MINT_WINDOW
        vm.warp(startTime + mintWindow + 1);

        vm.expectRevert(EventCertificate.MintingNotActive.selector);
        vm.prank(relayer);
        certificateContract.mint(alice, proofForAlice);
    }

    // Test 9: Soulbound property prevents transfers
    function test_Revert_TransferIsBlocked() public {
        vm.prank(relayer);
        certificateContract.mint(alice, proofForAlice);
        vm.prank(alice);
        vm.expectRevert(EventCertificate.NonTransferable.selector);
        certificateContract.transferFrom(alice, bob, 1);
    }

    // Test 10: tokenURI is generated correctly
    function test_TokenURI_IsCorrect() public {
        vm.prank(relayer);
        certificateContract.mint(alice, proofForAlice);

        string memory expectedURI = string(
            abi.encodePacked("ipfs://CID/", _toLowerHexString(alice), ".json")
        );
        assertEq(certificateContract.tokenURI(1), expectedURI);
    }

    // Test 10.1: tokenURI reverts for a non-existent token
    function test_Revert_TokenURINonExistentToken() public {
        vm.expectRevert(EventCertificate.NonExistentToken.selector);
        certificateContract.tokenURI(999);
    }

    // Test 12: Admin functions revert for non-owner
    function test_Revert_AdminFunctions_FromNonOwner() public {
        bytes32 newRoot = keccak256("newRoot");
        vm.prank(relayer);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, relayer));
        certificateContract.updateMerkleRoot(newRoot);
    }

    // --- Helper Functions ---
    function _toLowerHexString(address addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        for (uint i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }
}

