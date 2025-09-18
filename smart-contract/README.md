# EventCertificate Smart Contract

## Overview

The **EventCertificate** smart contract is an ERC-721–based **soulbound NFT** system designed to issue **non-transferable event participation certificates**.

## Key features include

- **Soulbound:** Once minted, tokens cannot be transferred or traded.
- **Gasless Minting:** A trusted relayer executes the mint transactions on behalf of attendees.
- **Merkle Proof Whitelisting:** Only eligible attendees (from a post-event whitelist) can mint their certificates.
- **Deterministic Metadata:** Metadata is tied to the attendee's wallet address, ensuring correct certificates regardless of mint order.
- **Time-Locked Minting Window:** Minting is only available within a 24-hour period after the event.

## Key Design Choices

### 1. Soulbound NFTs

- Overrides `_update` to prevent transfers or burns.
- Minting is the only way tokens are assigned.

### 2. Deterministic Metadata

- Each attendee's JSON/PNG metadata is named after their lowercase wallet address:
  - `ipfs://<CID>/0x1234abcd.json`
  - `ipfs://<CID>/0x1234abcd.png`
- The `tokenURI(tokenId)` function derives the owner's address and constructs the correct URI dynamically.

### 3. Incrementing Token IDs

- Token IDs increment sequentially (`1, 2, 3, …`) for uniqueness.
- Token metadata is **not** tied to tokenId, but to the **owner address**.

### 4. Minting Flow

1. Attendees fill out a Google Form with their wallet addresses.
2. Organizers collect addresses and generate a Merkle Tree (`merkleRoot` stored on-chain).
3. Attendees call the backend → backend fetches proof → relayer submits `mint(attendee, proof)`.
4. Contract verifies:
   - Relayer authorization.
   - Merkle proof validity.
   - Time window validity.
   - Attendee has not already minted.
5. NFT is minted to the attendee.

## Constructor

```solidity
constructor(
    string memory name_,
    string memory symbol_,
    string memory baseURI_,
    address relayer_,
    uint256 mintStartTime_,
    bytes32 merkleRoot_
)
```

- `name_` → The name of the ERC721 token.
- `symbol_` → The symbol of the ERC721 token.
- `baseURI_` → Base URI (e.g., `ipfs://CID/`)
- `relayer_` → Authorized relayer address
- `mintStartTime_` → Unix timestamp when minting opens
- `merkleRoot_` → Root of Merkle Tree whitelist

## Core Functions

### `mint(address attendee, bytes32[] calldata merkleProof)`

- Callable **only by the relayer**.
- Verifies:

  - Minting is within time window.
  - Attendee has not already minted.
  - Attendee is in whitelist (`merkleProof` valid).

- Mints a new soulbound NFT.

### `updateMerkleRoot(bytes32 newRoot) external onlyOwner`

- Updates the Merkle root for the whitelist.

### `setBaseURI(string calldata newBaseURI) external onlyOwner`

- Updates the base URI for metadata resolution.

### `tokenURI(uint256 tokenId) public view override returns (string memory)`

- Returns:

  ```txt
  ipfs://<baseURI>/<ownerAddress>.json
  ```

- Ensures each certificate points to the **correct attendee asset**.

## Errors

- `NotAuthorizedRelayer()` → Caller is not the relayer.
- `MintingNotActive()` → Attempted mint outside allowed time window.
- `AlreadyMinted()` → Attendee already received certificate.
- `InvalidProof()` → Merkle proof did not match whitelist.
- `NonTransferable()` → Attempted transfer or burn of a soulbound token.

## Events

- `CertificateMinted(address indexed attendee, uint256 indexed tokenId)`
  - Emitted whenever a new certificate is minted to an attendee.

## Soulbound Enforcement

This contract enforces **non-transferability** by overriding the `_update` hook from OpenZeppelin’s ERC721:

- ✅ Allowed: `mint` (from `address(0)` to attendee)
- ❌ Disallowed: Transfers between users
- ❌ Disallowed: Burns

```solidity
function _update(address to, uint256 tokenId, address auth)
    internal
    override
    returns (address)
{
    address from = _ownerOf(tokenId);

    // Disallow transfers between non-zero addresses (soulbound property)
    if (from != address(0) && to != address(0)) {
        revert NonTransferable();
    }

    return super._update(to, tokenId, auth);
}
```

## Minting Window

- Minting is restricted to a **24-hour window** starting at `mintStartTime`.
- Configurable during deployment.
- Prevents late or fraudulent claims.

```solidity
if (block.timestamp < mintStartTime || block.timestamp > mintStartTime + 24 hours) {
    revert MintingNotActive();
}
```

---

## Deployment

### Prerequisites

- **Foundry** installed (`forge`)
- `.env` file containing:

  ```env
  DEPLOYER_PRIVATE_KEY=0xabc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abcd
  NFT_NAME="TEST"
  NFT_SYMBOL="TEST"
  MERKLE_ROOT=0x9b7a7f1b23c9b58e635d4ab6c0bda8c6a4b9f5e1b6a9f9f2e5c1d8a7f9b6c123
  JSON_CID=QmXyzAbCdEfGh1234567890ExampleCID
  RELAYER_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
  MINT_DELAY=30
  LOCAL_RPC_URL=http://localhost:8545
  ```

### Deployment Command

```bash
forge script script/EventCertificate.s.sol:DeployEventCertificate \
  --rpc-url $LOCAL_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast

```

## Testing

Tests are written in **Foundry** (`EventCertificate.t.sol`) and cover:

- ✅ Successful mint with valid proof
- ✅ Rejection for invalid Merkle proof
- ✅ Rejection for attempts outside the minting window
- ✅ Rejection for double minting by the same attendee
- ✅ Enforcement of soulbound property (transfers and burns revert)

Run all tests (uint, integration, fuzz tests):

```bash
forge test -vvvv
```

## Off-Chain Metadata & Proofs

### 1. Merkle Tree Generation

- Script: `scripts/generate-merkle.js`
- Outputs:

  - `merkleRoot.txt` → Used in deployment
  - `merkleTree.json` → Mapping of addresses to Merkle proofs

### 2. Asset Generation

- Certificates (`.png`) and metadata (`.json`) are generated per attendee
- File names match the attendee’s **lowercased wallet address**:

  - `0xabc123...def.json`
  - `0xabc123...def.png`

### 3. IPFS Upload

- Upload folder to IPFS (via Pinata)
- Base URI = `ipfs://<CID>/`

## Backend Services

- **Proof Service**

  - Endpoint: `/get-proof?address=0x...`
  - Returns Merkle proof from `merkleTree.json`

- **Relayer Service**

  - Endpoint: `POST /mint`
  - Accepts `{ attendee, merkleProof }`
  - Submits mint transaction on behalf of the attendee
  - Returns `{ status, txHash }`

## Frontend Flow

1. User connects wallet
2. App requests proof from Proof Service
3. App sends `{ attendee, proof }` to Relayer Service
4. Relayer submits transaction to contract
5. App displays real-time transaction status

## Pre-Flight Checklist (Mainnet Launch)

1. ✅ Fund relayer wallet with sufficient ETH
2. ✅ Confirm IPFS CID in contract matches uploaded assets
3. ✅ Verify whitelist and Merkle proofs are correct
4. ✅ Run full test suite against Base Sepolia
5. ✅ Review backend service logs (Proof + Relayer)
