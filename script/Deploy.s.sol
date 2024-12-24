// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/contracts/Whistleblower.sol";
import "../src/contracts/Verifier.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy Verifier first
        Groth16Verifier verifier = new Groth16Verifier();
        
        // Deploy Whistleblower with Verifier address
        Whistleblower whistleblower = new Whistleblower(address(verifier));

        vm.stopBroadcast();

        console.log("Verifier deployed to:", address(verifier));
        console.log("Whistleblower deployed to:", address(whistleblower));
    }
} 