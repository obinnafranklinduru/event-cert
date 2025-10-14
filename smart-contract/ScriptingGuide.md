# Guide to Smart Contract Interaction Scripts

This guide provides a **complete workflow** for deploying and managing the `EventCertificate` contract. The process is broken into distinct scripts for **deployment**, **campaign management**, and **owner administration**.

---

## 1. Deployment Script (`DeployEventCertificate.s.sol`)

### Purpose

This is the first script you will run. Its sole purpose is to deploy a fresh instance of the main `EventCertificate` contract to the blockchain.

### How It Works

The script reads the required constructor arguments from your `.env` file and deploys the contract.

### Example Usage: Deployment

#### A. Configure your `.env` file

```bash
# .env file

# The private key of the account that will deploy and own the contract
DEPLOYER_PRIVATE_KEY=0x...

# Constructor arguments for the contract
NFT_NAME="My Event Certificate"
NFT_SYMBOL="MEC"
BASE_URI="ipfs://bafybeig5y7...j5a/"
RELAYER_ADDRESS=0x...
```

#### B. Run the deployment script

```bash
forge script script/DeployEventCertificate.s.sol:DeployEventCertificate \
  --rpc-url <your_rpc_url> \
  --broadcast
```

After a successful deployment, the script will print the new contract's address. Copy this address and save it in your `.env` file for later use:

```bash
# .env file
CERTIFICATE_CONTRACT_ADDRESS=0x...  # <-- Paste the deployed address here
```

---

## 2. Campaign Manager Script (`CampaignManager.s.sol`)

This is your **primary tool for day-to-day operations**. It uses command-line arguments to perform all event-related actions such as **creating**, **updating**, **activating**, and **deleting** campaigns.

### Example Usage: Campaign Management

#### A. Create a New Campaign

Set the campaign details in your `.env` file:

```bash
# .env file
CAMPAIGN_ID=1
MERKLE_ROOT=0x...
START_TIME=1760888400
END_TIME=1760974800
MAX_MINTS=500
```

Run the script with the `create` command:

```bash
forge script script/CampaignManager.s.sol:CampaignManager \
  --rpc-url <your_rpc_url> \
  --broadcast \
  --sig "run(string memory command)" "create"
```

#### B. Activate a Campaign

Update your `.env` file:

```bash
# .env file
CAMPAIGN_ID=1
IS_ACTIVE=true
```

Run the script with the `activate` command:

```bash
forge script script/CampaignManager.s.sol:CampaignManager \
  --rpc-url <your_rpc_url> \
  --broadcast \
  --sig "run(string memory command)" "activate"
```

---

## 3. Owner Administration Script (`OwnerAdmin.s.sol`)

This script handles **high-security administrative tasks** such as pausing the contract or updating key addresses. Separating these reduces the risk of accidental or malicious actions.

### Example Usage

#### A. Pause the Contract

```bash
forge script script/OwnerAdmin.s.sol:OwnerAdmin \
  --rpc-url <your_rpc_url> \
  --broadcast \
  --sig "run(string memory command)" "pause"
```

#### B. Update the Relayer Address

Set the new relayer address in your `.env` file:

```bash
# .env file
NEW_RELAYER_ADDRESS=0x...
```

Then run the script:

```bash
forge script script/OwnerAdmin.s.sol:OwnerAdmin \
  --rpc-url <your_rpc_url> \
  --broadcast \
  --sig "run(string memory command)" "updateRelayer"
```

---

### Summary

| Step | Script                         | Purpose                                     |
| ---- | ------------------------------ | ------------------------------------------- |
| 1    | `DeployEventCertificate.s.sol` | Deploy the main contract                    |
| 2    | `CampaignManager.s.sol`        | Manage campaigns (create, activate, update) |
| 3    | `OwnerAdmin.s.sol`             | Perform secure admin operations             |

With these three scripts, you have a **complete operational toolkit** for deploying, managing, and maintaining your event certificate smart contract system.
