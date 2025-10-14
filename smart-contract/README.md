# EventCertificate Smart Contract

## Overview

The **EventCertificate** is an advanced, multi-event soulbound NFT system built on the **ERC-721** standard. It is designed to issue **non-transferable event participation certificates** across multiple, distinct events ("campaigns") from a single deployed contract instance.

This repository contains the smart contract, a comprehensive test suite (unit, integration, and fuzz), and a full set of **Foundry scripts** for deployment and administration.

---

## Key Features

### Reusable & Multi-Event

Deploy the contract once and use it to run an unlimited number of minting events ("campaigns"), each with its own unique whitelist, timeline, and minting rules.

### Soulbound (Non-Transferable)

Once minted, tokens are permanently bound to the owner's wallet and cannot be transferred or traded.

### Gasless Minting

A trusted **relayer** submits minting transactions, providing a seamless and gas-free experience for attendees.

### Merkle Proof Whitelisting

Each campaign is secured by its own **Merkle Tree**, ensuring only eligible, whitelisted attendees can mint.

### Pausable Security

The contract can be **paused** in an emergency to halt all minting activity, providing a critical safety feature.

### Two-Step Ownership

Utilizes OpenZeppelin’s **Ownable2Step** for safer ownership transfers, preventing accidental loss of control.

### Deterministic Metadata

The metadata URI for each token is derived from the owner’s address, not the token ID, ensuring the correct certificate is always displayed.

---

## How It Works: The Campaign Model

The core of the contract is the **Campaign** structure. Instead of deploying a new contract for each event, the owner simply creates a new campaign.

1. **Deploy Once:** Deploy the main `EventCertificate` contract to the blockchain.
2. **Generate Whitelist Off-Chain:** Collect participant addresses and generate a **Merkle Tree**, yielding a unique `merkleRoot`.
3. **Create Campaign On-Chain:** The owner calls `createCampaign()` with the event’s parameters (`merkleRoot`, `startTime`, `endTime`, `maxMints`).
4. **Activate Campaign:** When the event is ready, call `setCampaignActiveStatus()` to open the minting window.
5. **Mint:** Attendees interact with a frontend, providing their Merkle proof to a relayer. The relayer then calls `mint()` for the corresponding `campaignId`.

---

## Core Functions

The contract separates administrative tasks into two main categories:

### Campaign Management

- `createCampaign(id, merkleRoot, startTime, endTime, maxMints)` – Creates a new, inactive minting campaign.
- `updateCampaignBeforeStart(id, ...)` – Allows modification of a campaign before its start time.
- `setCampaignActiveStatus(id, isActive)` – Activates or deactivates a campaign.
- `deleteCampaign(id)` – Deletes a misconfigured campaign before it starts.

### Minting

- `mint(attendee, campaignId, proof)` – The main function (callable only by the relayer) that mints a certificate for a specific campaign.

### Owner Administration

- `pause()` / `unpause()` – Emergency stop and resume functionality.
- `updateRelayer(newRelayer)` – Updates the trusted relayer address.
- `setBaseURI(newBaseURI)` – Updates the base URI for all metadata.
- `transferOwnership(newOwner)` / `acceptOwnership()` – Securely transfers ownership.

---

## Project Structure

```txt
.
├── src/         # Main smart contract source
├── script/      # Deployment and management scripts
├── test/        # Unit, integration, and fuzz tests
├── lib/         # Dependencies (forge-std, openzeppelin)
├── .env         # Environment variables
└── foundry.toml # Project configuration
```

---

## Deployment & Management

Interaction with the contract is handled via a suite of Foundry scripts. For detailed commands and usage, see **ScriptingGuide.md**.

### Scripts

- `DeployEventCertificate.s.sol` – Deploys a new instance of the EventCertificate contract. _(Run this only once.)_
- `CampaignManager.s.sol` – Manages campaigns (create, update, activate, delete).
- `OwnerAdmin.s.sol` – Handles owner-only operations (pause, relayer update, ownership transfer).

### Example Deployment Command

```bash
# First, configure .env with NFT_NAME, SYMBOL, BASE_URI, RELAYER_ADDRESS
forge script script/DeployEventCertificate.s.sol:DeployEventCertificate \
  --rpc-url <your_rpc_url> \
  --broadcast
```

---

## Testing

The contract includes a **comprehensive test suite** to ensure correctness and security. See **TestingGuide.md** for full details.

### Test Types

- **Unit Tests:** `test/unit/EventCertificate.t.sol`
- **Integration Tests:** `test/integration/EventCertificate.int.t.sol`
- **Fuzz & Invariant Tests:** `test/fuzz/EventCertificate.fuzz.t.sol`

### Run All Tests

```bash
forge test
```

### Check Test Coverage

```bash
forge coverage
```

---

**Author:** Obinna Franklin Duru
**Framework:** Foundry  
**License:** MIT
