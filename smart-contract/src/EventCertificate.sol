// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/// @title EventCertificate
/// @author Obinna Franklin Duru
/// @notice A reusable, pausable, and soulbound ERC721 certificate contract for multiple events.
/// @dev Manages minting "campaigns" with unique whitelists, timelines, and mint limits.
/// A trusted relayer facilitates gasless minting for whitelisted participants.
contract EventCertificate is ERC721, Ownable2Step, Pausable {
    // --- Custom Errors ---
    error NotAuthorizedRelayer();
    error AlreadyMinted();
    error InvalidProof();
    error NonTransferable();
    error NonExistentToken();
    error ZeroAddress();
    error CampaignNotActive();
    error CampaignDoesNotExist();
    error InvalidCampaignTimes();
    error CampaignMustStartInFuture();
    error EmptyMerkleRoot();
    error MintingWindowNotOpen();
    error ProofTooLong();
    error InvalidInput();
    error CannotModifyStartedCampaign();
    error MintLimitReached();
    error CampaignDurationTooLong();
    error CampaignExpired();
    error CampaignHasMints();

    // --- Constants ---
    uint256 private constant MAX_PROOF_DEPTH = 500;
    uint256 private constant MAX_CAMPAIGN_DURATION = 365 days;

    // --- Structs ---
    /// @notice Holds all parameters for a single minting event.
    struct MintingCampaign {
        bytes32 merkleRoot;
        uint256 startTime;
        uint256 endTime;
        uint256 maxMints;
        bool isActive;
    }

    // --- State Variables ---
    address public relayer;
    mapping(uint256 => MintingCampaign) public campaigns;
    mapping(uint256 => mapping(address => bool)) public hasMintedInCampaign;
    mapping(uint256 => uint256) public campaignMintCount;
    mapping(uint256 => uint256) public tokenToCampaignId;
    mapping(uint256 => string) public campaignBaseURI;
    uint256 private _nextTokenId = 1;
    uint256 private _nextCampaignId = 1;

    // --- Events ---
    event CertificateMinted(address indexed attendee, uint256 indexed tokenId, uint256 indexed campaignId);
    event CampaignCreated(
        uint256 indexed campaignId, bytes32 merkleRoot, uint256 startTime, uint256 endTime, uint256 maxMints
    );
    event CampaignUpdated(uint256 indexed campaignId, bytes32 newMerkleRoot, uint256 newStartTime, uint256 newEndTime);
    event CampaignActiveStatusChanged(uint256 indexed campaignId, bool isActive);
    event CampaignDeleted(uint256 indexed campaignId);
    event RelayerUpdated(address newRelayer);
    event CampaignBaseURIUpdated(uint256 indexed campaignId, string newBaseURI);

    // --- Constructor ---
    /// @notice Initializes the contract with core, immutable parameters.
    /// @param name_ The name of the ERC721 token collection.
    /// @param symbol_ The symbol of the ERC721 token collection.
    /// @param relayer_ The trusted address that will pay gas fees for minting.
    constructor(string memory name_, string memory symbol_, address relayer_)
        ERC721(name_, symbol_)
        Ownable(msg.sender)
    {
        if (bytes(name_).length == 0 || bytes(symbol_).length == 0) {
            revert InvalidInput();
        }
        if (relayer_ == address(0)) revert ZeroAddress();

        relayer = relayer_;
    }

    // --- Minting Function (Relayer Only) ---
    /// @notice Mints a soulbound certificate to an attendee for a specific campaign.
    /// @dev Checks campaign status, time windows, mint limits, and Merkle proof validity.
    /// @param attendee The address that will receive the certificate NFT.
    /// @param campaignId The ID of the campaign the user is minting for.
    /// @param merkleProof An array of bytes32 hashes forming the Merkle proof.
    function mint(address attendee, uint256 campaignId, bytes32[] calldata merkleProof) external whenNotPaused {
        if (attendee == address(0)) revert ZeroAddress();
        if (msg.sender != relayer) revert NotAuthorizedRelayer();
        if (merkleProof.length > MAX_PROOF_DEPTH) revert ProofTooLong();

        MintingCampaign storage campaign = campaigns[campaignId];

        if (campaign.merkleRoot == bytes32(0)) revert CampaignDoesNotExist();
        if (!campaign.isActive) revert CampaignNotActive();
        if (block.timestamp < campaign.startTime || block.timestamp > campaign.endTime) {
            revert MintingWindowNotOpen();
        }
        if (hasMintedInCampaign[campaignId][attendee]) revert AlreadyMinted();
        if (campaignMintCount[campaignId] >= campaign.maxMints) revert MintLimitReached();

        bytes32 leaf = keccak256(abi.encodePacked(attendee));
        if (!MerkleProof.verify(merkleProof, campaign.merkleRoot, leaf)) {
            revert InvalidProof();
        }

        uint256 tokenId = _nextTokenId;
        hasMintedInCampaign[campaignId][attendee] = true;
        campaignMintCount[campaignId]++;
        tokenToCampaignId[tokenId] = campaignId;

        unchecked {
            _nextTokenId++;
        }

        emit CertificateMinted(attendee, tokenId, campaignId);
        _safeMint(attendee, tokenId);
    }

    // --- Admin Functions ---

    /// @notice Creates a new minting campaign. Campaigns are inactive by default.
    /// @param merkleRoot The whitelist Merkle root.
    /// @param startTime The Unix timestamp for when minting begins.
    /// @param endTime The Unix timestamp for when minting ends.
    /// @param maxMints The maximum number of NFTs that can be minted for this campaign.
    function createCampaign(
        bytes32 merkleRoot,
        uint256 startTime,
        uint256 endTime,
        uint256 maxMints,
        string calldata baseURI_
    ) external onlyOwner {
        if (bytes(baseURI_).length == 0) revert InvalidInput();
        if (startTime < block.timestamp) revert CampaignMustStartInFuture();
        if (startTime >= endTime) revert InvalidCampaignTimes();
        if (endTime - startTime > MAX_CAMPAIGN_DURATION) revert CampaignDurationTooLong();
        if (merkleRoot == bytes32(0)) revert EmptyMerkleRoot();

        uint256 campaignId = _nextCampaignId;
        campaigns[campaignId] = MintingCampaign({
            merkleRoot: merkleRoot,
            startTime: startTime,
            endTime: endTime,
            maxMints: maxMints,
            isActive: false
        });

        campaignBaseURI[campaignId] = baseURI_;

        unchecked {
            _nextCampaignId++;
        }
        emit CampaignCreated(campaignId, merkleRoot, startTime, endTime, maxMints);
    }

    /// @notice Updates the parameters of a campaign BEFORE it has started.
    /// @param campaignId The ID of the campaign to update.
    /// @param newMerkleRoot The new whitelist Merkle root.
    /// @param newStartTime The new start time.
    /// @param newEndTime The new end time.
    function updateCampaignBeforeStart(
        uint256 campaignId,
        bytes32 newMerkleRoot,
        uint256 newStartTime,
        uint256 newEndTime
    ) external onlyOwner {
        MintingCampaign storage campaign = campaigns[campaignId];
        if (campaign.merkleRoot == bytes32(0)) revert CampaignDoesNotExist();
        if (block.timestamp >= campaign.startTime) revert CannotModifyStartedCampaign();

        if (newStartTime < block.timestamp) revert CampaignMustStartInFuture();
        if (newStartTime >= newEndTime) revert InvalidCampaignTimes();
        if (newEndTime - newStartTime > MAX_CAMPAIGN_DURATION) revert CampaignDurationTooLong();
        if (newMerkleRoot == bytes32(0)) revert EmptyMerkleRoot();

        campaign.merkleRoot = newMerkleRoot;
        campaign.startTime = newStartTime;
        campaign.endTime = newEndTime;

        emit CampaignUpdated(campaignId, newMerkleRoot, newStartTime, newEndTime);
    }

    /// @notice Deletes a campaign that was created by mistake.
    /// @dev Can only be called before the campaign starts, if it's inactive, and if no mints have occurred.
    /// @param campaignId The ID of the campaign to delete.
    function deleteCampaign(uint256 campaignId) external onlyOwner {
        MintingCampaign storage campaign = campaigns[campaignId];
        if (campaign.merkleRoot == bytes32(0)) revert CampaignDoesNotExist();
        if (campaign.isActive) revert CampaignNotActive(); // Must be inactive
        if (block.timestamp >= campaign.startTime) revert CannotModifyStartedCampaign();
        if (campaignMintCount[campaignId] > 0) revert CampaignHasMints(); // Cannot delete if mints exist

        delete campaigns[campaignId];
        emit CampaignDeleted(campaignId);
    }

    /// @notice Activates or deactivates a campaign.
    /// @param campaignId The ID of the campaign to modify.
    /// @param isActive The new active status.
    function setCampaignActiveStatus(uint256 campaignId, bool isActive) external onlyOwner {
        MintingCampaign storage campaign = campaigns[campaignId];
        if (campaign.merkleRoot == bytes32(0)) revert CampaignDoesNotExist();

        if (isActive) {
            // if (block.timestamp < campaign.startTime) revert MintingWindowNotOpen();
            if (block.timestamp > campaign.endTime) revert CampaignExpired();
        }

        campaign.isActive = isActive;
        emit CampaignActiveStatusChanged(campaignId, isActive);
    }

    /// @notice Allows the contract owner to burn (revoke) a certificate NFT.
    /// @param tokenId The token ID to burn.
    function burn(uint256 tokenId) external onlyOwner {
        address ownerAddr = _ownerOf(tokenId);
        if (ownerAddr == address(0)) revert NonExistentToken();

        uint256 campaignId = tokenToCampaignId[tokenId];
        if (campaignId == 0) revert NonExistentToken();

        // Mark user as eligible to re-mint if needed
        if (hasMintedInCampaign[campaignId][ownerAddr]) {
            hasMintedInCampaign[campaignId][ownerAddr] = false;
        }

        // Reduce mint count on campaign if needed
        if (campaignMintCount[campaignId] > 0) {
            campaignMintCount[campaignId]--;
        }

        delete tokenToCampaignId[tokenId];

        _burn(tokenId);
    }

    /// @notice Pauses all minting in an emergency.
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Resumes minting after a pause.
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Updates the trusted relayer address.
    /// @param newRelayer The address of the new relayer.
    function updateRelayer(address newRelayer) external onlyOwner {
        if (newRelayer == address(0)) revert ZeroAddress();
        relayer = newRelayer;
        emit RelayerUpdated(newRelayer);
    }

    /// @notice Updates the base URI for a campaign (metadata storage location).
    /// @dev Can be called at any time by owner, even after minting, to fix metadata issues.
    /// @param campaignId The campaign whose metadata URI should be updated.
    /// @param newBaseURI The new base URI pointing to updated metadata.
    function updateCampaignBaseURI(uint256 campaignId, string calldata newBaseURI) external onlyOwner {
        MintingCampaign storage campaign = campaigns[campaignId];
        if (campaign.merkleRoot == bytes32(0)) revert CampaignDoesNotExist();
        if (bytes(newBaseURI).length == 0) revert InvalidInput();

        campaignBaseURI[campaignId] = newBaseURI;
        emit CampaignBaseURIUpdated(campaignId, newBaseURI);
    }

    // --- View Functions ---

    /// @notice Gets all data for a specific campaign.
    /// @param campaignId The ID of the campaign.
    /// @return A MintingCampaign struct in memory.
    function getCampaign(uint256 campaignId) external view returns (MintingCampaign memory) {
        return campaigns[campaignId];
    }

    /// @notice Checks if a user meets the basic requirements to mint (does not check Merkle proof).
    /// @param attendee The address to check.
    /// @param campaignId The campaign to check against.
    /// @return A boolean indicating if the user meets the current criteria to mint.
    function canMint(address attendee, uint256 campaignId) external view returns (bool) {
        MintingCampaign storage campaign = campaigns[campaignId];
        if (!campaign.isActive || campaign.merkleRoot == bytes32(0)) return false;
        if (block.timestamp < campaign.startTime || block.timestamp > campaign.endTime) return false;
        if (hasMintedInCampaign[campaignId][attendee]) return false;
        if (campaignMintCount[campaignId] >= campaign.maxMints) return false;
        return true;
    }

    // --- Soulbound and Metadata Logic ---

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert NonTransferable();
        }
        return super._update(to, tokenId, auth);
    }

    /// @notice Returns the metadata URI for a given token.
    /// @param tokenId The ID of the token.
    /// @return The metadata URI string.
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        address ownerAddr = _ownerOf(tokenId);
        if (ownerAddr == address(0)) revert NonExistentToken();

        // 1. Find which campaign this token belongs to
        uint256 campaignId = tokenToCampaignId[tokenId];

        // 2. Get the specific baseURI for THAT campaign
        string memory baseURI = campaignBaseURI[campaignId];
        if (bytes(baseURI).length == 0) revert NonExistentToken();

        string memory addrStr = _toAsciiString(ownerAddr);
        return string.concat(baseURI, addrStr, ".json");
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

    /// @notice Returns the next token ID that will be minted.
    /// @return The next token ID.
    function nextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }
}
