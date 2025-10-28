// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {EventCertificate} from "../src/EventCertificate.sol";

/// @title OwnerAdmin
/// @notice A script for high-security, owner-only administrative tasks.
/// @dev Use command-line arguments to specify the action.
contract OwnerAdmin is Script {
    EventCertificate internal cert;

    function setUp() public {
        address contractAddress = vm.envAddress("CERTIFICATE_CONTRACT_ADDRESS");
        if (contractAddress == address(0)) revert("CERTIFICATE_CONTRACT_ADDRESS not set");
        cert = EventCertificate(contractAddress);
    }

    /// @notice Main entry point for the script.
    /// @param command The action to perform: "transferOwner", "acceptOwner", "updateRelayer", "updateBaseURI", "pause", "unpause".
    function run(string memory command) external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        if (deployerPrivateKey == 0) revert("DEPLOYER_PRIVATE_KEY not set");

        vm.startBroadcast(deployerPrivateKey);

        if (keccak256(abi.encodePacked(command)) == keccak256("transferOwner")) {
            _transferOwnership();
        } else if (keccak256(abi.encodePacked(command)) == keccak256("acceptOwner")) {
            _acceptOwnership();
        } else if (keccak256(abi.encodePacked(command)) == keccak256("updateRelayer")) {
            _updateRelayer();
        } else if (keccak256(abi.encodePacked(command)) == keccak256("pause")) {
            cert.pause();
            console.log("Contract has been paused.");
        } else if (keccak256(abi.encodePacked(command)) == keccak256("unpause")) {
            cert.unpause();
            console.log("Contract has been unpaused.");
        } else {
            revert("Invalid command. See OwnerAdmin.s.sol for options.");
        }

        vm.stopBroadcast();
    }

    function _transferOwnership() internal {
        address newOwner = vm.envAddress("NEW_OWNER_ADDRESS");
        if (newOwner == address(0)) revert("NEW_OWNER_ADDRESS not set");
        console.log("Transferring ownership to: %s", newOwner);
        cert.transferOwnership(newOwner);
        console.log("Ownership transfer initiated. The new owner must now accept.");
    }

    function _acceptOwnership() internal {
        // NOTE: The pending owner must be the one broadcasting this transaction.
        // Ensure the DEPLOYER_PRIVATE_KEY is set to the new owner's key.
        console.log("Accepting ownership...");
        cert.acceptOwnership();
        console.log("Ownership successfully transferred to: %s", msg.sender);
    }

    function _updateRelayer() internal {
        address newRelayer = vm.envAddress("NEW_RELAYER_ADDRESS");
        if (newRelayer == address(0)) revert("NEW_RELAYER_ADDRESS not set");
        console.log("Updating relayer to: %s", newRelayer);
        cert.updateRelayer(newRelayer);
        console.log("Relayer updated successfully.");
    }
}
