# Backend API

A secure Node.js backend API for minting attendance certificates using Merkle tree verification on Base blockchain networks.

## Endpoints

### GET `/api/get-proof?address={address}`

Get Merkle proof for an address to verify eligibility.

**Parameters:**

- `address` (string, required): Ethereum address to check

### POST `/api/mint`

Mint a certificate NFT for an eligible address.

**Request Body:**

```json
{
  "attendee": "0x742d35Cc6635C0532925a3b8D20d1c0e15afe5B7",
  "merkleProof": ["0x123abc...", "0x456def..."]
}
```

## Security Features

### Input Validation

- Address format validation using ethers.js
- Merkle proof array validation

### Error Handling

- Comprehensive error catching
- Sanitized error responses
- Security-focused error messages
- Detailed logging for debugging

## Configuration

### Environment Variables

| Variable               | Description                | Default                 | Required |
| ---------------------- | -------------------------- | ----------------------- | -------- |
| `PORT`                 | Server port                | `8000`                  | No       |
| `NODE_ENV`             | Environment                | `development`           | No       |
| `CORS_ORIGIN`          | Allowed frontend origin    | `http://localhost:5173` | No       |
| `BASE_RPC_URL`         | Base mainnet RPC           | -                       | Yes      |
| `BASE_SEPOLIA_RPC_URL` | Base Sepolia RPC           | -                       | Yes      |
| `PRIVATE_KEY`          | Contract owner private key | -                       | Yes      |
| `CONTRACT_ADDRESS`     | Deployed contract address  | -                       | Yes      |
| `DEFAULT_NETWORK`      | Default blockchain network | `base-sepolia`          | No       |

### Blockchain Networks

#### Base Sepolia (Testnet)

- **Chain ID:** 84532
- **RPC:** `https://sepolia.base.org`
- **Explorer:** `https://sepolia.basescan.org`
- **Currency:** ETH (testnet)

#### Base Mainnet

- **Chain ID:** 8453
- **RPC:** `https://mainnet.base.org`
- **Explorer:** `https://basescan.org`
- **Currency:** ETH
