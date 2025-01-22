// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/contracts/JwtVerifier.sol";

contract DeployJwtVerifier is Script {
    function run() public {
        string memory rawKey = vm.envString("PRIVATE_KEY");
        bytes memory key = vm.parseBytes(rawKey);
        uint256 deployerPrivateKey = uint256(bytes32(key));

        vm.startBroadcast(deployerPrivateKey);

        JwtVerifier verifier = new JwtVerifier();
        console.log("JwtVerifier deployed to:", address(verifier));

        vm.stopBroadcast();
    }
} 