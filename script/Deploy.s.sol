// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/contracts/JwtVerifier.sol";

contract Deploy is Script {
    function run() external {
        // Read private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy verifier
        JwtVerifier verifier = new JwtVerifier();
        console.log("JwtVerifier deployed to:", address(verifier));
        
        vm.stopBroadcast();
    }
} 