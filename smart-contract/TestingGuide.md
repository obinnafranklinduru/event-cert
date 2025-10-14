# Guide to Smart Contract Testing

This guide provides a complete overview of the testing strategy for the **EventCertificate** contract. Following these steps is crucial for verifying the correctness and security of the contract before and after any changes. The project uses the **Foundry** framework for all testing.

---

## Testing Philosophy

Our testing is structured in **three layers** to ensure comprehensive coverage:

### 1. Unit Tests (`*.t.sol`)

Focus on a single, isolated piece of functionality. These verify that each function behaves as expected, including correct state changes and proper error handling (reverts).

### 2. Integration Tests (`*.int.t.sol`)

Simulate a realistic, end-to-end user journey. These ensure that different functions and components of the contract work together correctly across multiple transactions and state changes.

### 3. Fuzz & Invariant Tests (`*.fuzz.t.sol`)

Feed the contract large volumes of random data to uncover edge cases. These tests prove that core rules (invariants) are **never broken**, regardless of input variations.

---

## Running the Tests

All commands should be run from the **root** of the project directory.

### 1. Running All Tests

Run the entire suite (unit, integration, and fuzz):

```bash
forge test
```

This is the main command to confirm that the project is healthy.

---

### 2. Running Specific Test Suites

Run tests from a specific file or group of files:

```bash
# Run all Unit Tests
forge test --match-path test/unit/EventCertificate.t.sol

# Run all Integration Tests
forge test --match-path test/integration/EventCertificate.int.t.sol

# Run Fuzz test
forge test --match-path test/fuzz/EventCertificate.int.t.sol
```

---

### 3. Running a Single Test Function

Focus on a specific function or feature:

```bash
# Example: Run only the test for successful minting
forge test --match-test test_mint_succeeds

# Example: Run all tests related to campaign creation
forge test --match-test test_createCampaign
```

---

### 4. Debugging with Verbosity

If a test fails, you can view detailed execution traces using verbosity flags (`-v`). Add more `v`s for deeper detail:

```bash
forge test --match-test test_mint_revertsAtMaxMints -vvvv
```

---

### 5. Checking Test Coverage

Ensure your tests cover all contract logic:

```bash
forge coverage
```

This generates a coverage report showing which lines of code were executed during testing. Aim for a **high coverage percentage** for confidence in correctness.

The output includes a summary table for each contract and function.

---

## Testing Deployment & Management Scripts

Scripts can also be tested by running them on a **local blockchain node** to simulate real deployments.

### Step 1: Start a Local Node

In a separate terminal, start an Anvil instance:

```bash
anvil
```

### Step 2: Run the Script

Execute your script against the local Anvil node:

```bash
# First, configure your .env file with a private key from Anvil

# Example: "Test" the deployment script
forge script script/DeployEventCertificate.s.sol:DeployEventCertificate \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast

# Example: "Test" the campaign manager script
forge script script/CampaignManager.s.sol:CampaignManager \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --sig "run(string memory command)" "create"

# Example: "Test" the admins script
forge script script/OwnerAdmin.s.sol:OwnerAdmin \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --sig "run(string memory command)" "updateBaseURI"
```

This **dry run** ensures that your scripts execute without errors and that the resulting on-chain state matches expectations.
