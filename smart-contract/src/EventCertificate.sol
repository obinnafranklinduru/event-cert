// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/// @title EventCertificate
/// @author Obinna Franklin Duru
/// @notice A soulbound (non-transferable) ERC721 certificate contract.
/// It uses a Merkle Tree for whitelisting and a trusted relayer for gasless minting.
/// The tokenURI is deterministically generated from the owner's address.
contract EventCertificate is ERC721, Ownable {
    // --- Custom Errors ---
    error NotAuthorizedRelayer();
    error MintingNotActive();
    error AlreadyMinted();
    error InvalidProof();
    error NonTransferable();
    error NonExistentToken();
    error ZeroAddress();

    // --- State Variables ---
    string private _baseTokenURI;
    address public relayer;
    uint256 public immutable mintStartTime;
    uint256 public constant MINT_WINDOW = 24 hours; // Minting is only active for 24 hours
    bytes32 public merkleRoot;

    // Mapping to prevent a user from minting more than once.
    mapping(address => bool) public hasMinted;

    // A simple, incrementing counter for token IDs. Starts at 1.
    uint256 private _nextTokenId = 1;

    // --- Events ---
    event CertificateMinted(address indexed attendee, uint256 indexed tokenId);
    event MerkleRootUpdated(bytes32 newRoot);
    event RelayerUpdated(address newRelayer);
    event BaseURIUpdated(string newBaseURI);

    // --- Constructor ---
    /// @notice Initializes the contract with necessary parameters.
    /// @param name_ The name of the ERC721 token.
    /// @param symbol_ The symbol of the ERC721 token.
    /// @param baseURI_ The base URI for the metadata, pointing to an IPFS folder.
    /// @param relayer_ The trusted address that will pay gas fees for minting.
    /// @param mintStartTime_ The Unix timestamp when the minting window opens.
    /// @param merkleRoot_ The Merkle Root of the whitelist of eligible attendees.
    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseURI_,
        address relayer_,
        uint256 mintStartTime_,
        bytes32 merkleRoot_
    ) ERC721(name_, symbol_) Ownable(msg.sender) {
        if (relayer_ == address(0)) revert ZeroAddress();

        _baseTokenURI = baseURI_;
        relayer = relayer_;
        mintStartTime = mintStartTime_;
        merkleRoot = merkleRoot_;
    }

    // --- Minting Function (Relayer Only) ---
    /// @notice Mints a soulbound certificate to an attendee if their Merkle proof is valid.
    /// @dev Can only be called by the trusted relayer address.
    /// @param attendee The address that will receive the certificate NFT.
    /// @param merkleProof The Merkle proof that proves the attendee is on the whitelist.
    function mint(address attendee, bytes32[] calldata merkleProof) external {
        // --- Checks ---
        if (msg.sender != relayer) revert NotAuthorizedRelayer();
        if (block.timestamp < mintStartTime || block.timestamp > mintStartTime + MINT_WINDOW) {
            revert MintingNotActive();
        }
        if (hasMinted[attendee]) revert AlreadyMinted();

        // Verify that the attendee is on the whitelist using their Merkle proof.
        bytes32 leaf = keccak256(abi.encode(attendee));
        if (!MerkleProof.verify(merkleProof, merkleRoot, leaf)) {
            revert InvalidProof();
        }

        // --- Effects ---
        uint256 tokenId = _nextTokenId;
        hasMinted[attendee] = true;
        _nextTokenId++;

        // --- Interaction ---
        _safeMint(attendee, tokenId);

        emit CertificateMinted(attendee, tokenId);
    }

    // --- Soulbound (Non-transferable) Logic ---
    /// @dev Overrides the internal _update function (from OpenZeppelin v5) to block all transfers
    /// except for minting (from address(0)) and burning (to address(0)).
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        // Allow minting and burning, but disallow all other transfers.
        if (from != address(0) && to != address(0)) {
            revert NonTransferable();
        }
        return super._update(to, tokenId, auth);
    }

    // --- Metadata Logic ---
    /// @notice Returns the metadata URI for a given token.
    /// @dev The URI is deterministically generated based on the token owner's address.
    /// This ensures the link is permanent and independent of minting order.
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        // Check if the token exists before proceeding.
        if (ownerOf(tokenId) == address(0)) {
            revert NonExistentToken();
        }

        address ownerAddr = ownerOf(tokenId);
        string memory addrStr = _toAsciiString(ownerAddr);

        // The final URL will be, e.g., "ipfs://CID/0x123abc...def.json"
        return string.concat(_baseTokenURI, addrStr, ".json");
    }

    /// @dev Helper function to convert an address to its lowercase hex string representation.
    function _toAsciiString(address x) internal pure returns (string memory) {
        // Convert the address to a bytes32 value by first converting to uint160 and then to uint256.
        // This ensures the address is padded to 32 bytes with leading zeros.
        bytes32 value = bytes32(uint256(uint160(x)));

        // Define the hexadecimal characters for lookup.
        bytes memory alphabet = "0123456789abcdef";

        // Create a bytes array of length 42: 2 bytes for '0x' and 40 bytes for the 20-byte address (each byte becomes two hex characters).
        bytes memory str = new bytes(42);
        str[0] = "0";
        str[1] = "x";

        // Loop through each byte of the address (20 bytes).
        for (uint256 i = 0; i < 20; i++) {
            // Extract the byte at position i + 12 from the bytes32 value.
            // The address is stored in the last 20 bytes of the 32-byte value, so we start at index 12.
            // Get the high nibble (4 bits) of the byte by shifting right by 4 bits.
            // Convert to uint8 to use as an index in the alphabet.
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];

            // Get the low nibble (4 bits) of the byte by masking with 0x0F.
            // Convert to uint8 to use as an index in the alphabet.
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        // Convert the bytes array to a string and return it.
        return string(str);
    }

    // --- Admin Functions ---
    /// @notice Allows the contract owner to update the Merkle Root.
    function updateMerkleRoot(bytes32 newRoot) external onlyOwner {
        merkleRoot = newRoot;
        emit MerkleRootUpdated(newRoot);
    }

    /// @notice Allows the contract owner to update the trusted relayer address.
    function updateRelayer(address newRelayer) external onlyOwner {
        if (newRelayer == address(0)) revert ZeroAddress();
        relayer = newRelayer;
        emit RelayerUpdated(newRelayer);
    }

    /// @notice Allows the contract owner to update the base URI for metadata.
    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    /// @notice A public view function for the base URI.
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /// @notice A view function to see the next token ID that will be minted.
    function nextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }
}
