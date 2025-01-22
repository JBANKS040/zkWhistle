// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/contracts/WhistleblowReport.sol";

contract DeployWhistleblowReport is Script {
    function run() external {
        string memory rawKey = vm.envString("PRIVATE_KEY");
        bytes memory key = vm.parseBytes(rawKey);
        uint256 deployerPrivateKey = uint256(bytes32(key));
        
        address verifierAddress = vm.envAddress("VERIFIER_ADDRESS");
        console.log("Using verifier address:", verifierAddress);

        vm.startBroadcast(deployerPrivateKey);

        WhistleblowReport report = new WhistleblowReport(verifierAddress);
        console.log("WhistleblowReport deployed to:", address(report));

        vm.stopBroadcast();
    }
} 