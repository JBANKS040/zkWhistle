// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/contracts/ZkWhistleblower.sol";

contract DeployZkWhistleblower is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        ZkWhistleblower zkWhistleblower = new ZkWhistleblower();
        
        // IMPORTANT: Verify skipVerification is false for production deployment
        bool skipVerification = zkWhistleblower.skipVerification();
        require(!skipVerification, "DANGER: skipVerification must be false for production");
        
        vm.stopBroadcast();
        
        console.log("ZkWhistleblower deployed at:", address(zkWhistleblower));
    }
} 