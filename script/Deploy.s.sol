// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {Script, console2} from "forge-std/Script.sol";
import {ZkWhistle} from "../src/ZkWhistle.sol";

contract Deploy is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address verifier = vm.envAddress("VERIFIER_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy ZkWhistle
        ZkWhistle whistleblower = new ZkWhistle();
        whistleblower.initialize(verifier);

        vm.stopBroadcast();

        console2.log("ZkWhistle deployed to:", address(whistleblower));
    }
} 