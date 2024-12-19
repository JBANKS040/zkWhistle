// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {ZkWhistle} from "../src/ZkWhistle.sol";

contract ZkWhistleTest is Test {
    ZkWhistle public whistleblower;
    address public verifier;
    address public user;

    function setUp() public {
        // Deploy mock verifier
        verifier = makeAddr("verifier");
        vm.etch(verifier, hex"00"); // Add mock bytecode
        
        // Deploy main contract
        whistleblower = new ZkWhistle();
        whistleblower.initialize(verifier);
        
        // Setup test user
        user = makeAddr("user");
        vm.deal(user, 100 ether);
    }

    function testVerifyWhistleblower() public {
        // Mock proof and public inputs
        bytes memory proof = hex"1234";
        uint256[] memory publicInputs = new uint256[](2);
        publicInputs[0] = block.timestamp + 1 days; // expiry
        publicInputs[1] = uint256(keccak256("Test Org")); // org hash

        // Mock verifier response
        vm.mockCall(
            verifier,
            abi.encodeWithSignature("verifyProof(bytes,uint256[])", proof, publicInputs),
            abi.encode(true)
        );

        // Test verification
        vm.prank(user);
        bool success = whistleblower.verifyWhistleblower(proof, publicInputs);
        assertTrue(success);
        assertTrue(whistleblower.verifiedWhistleblowers(user));
    }

    function testSubmitReport() public {
        // First verify the whistleblower
        testVerifyWhistleblower();

        // Prepare report data
        bytes32 titleHash = keccak256("Test Title");
        bytes32 contentHash = keccak256("Test Content");
        bytes32 pdfHash = keccak256("Test PDF");
        bytes32 orgHash = bytes32(uint256(keccak256("Test Org")));

        // Submit report
        vm.prank(user);
        uint256 reportId = whistleblower.submitReport(
            titleHash,
            contentHash,
            pdfHash,
            orgHash
        );

        // Verify report data
        (
            bytes32 storedTitleHash,
            bytes32 storedContentHash,
            bytes32 storedPdfHash,
            bytes32 storedOrgHash,
            uint256 timestamp,
            bytes32 proofHash
        ) = whistleblower.reports(reportId);

        assertEq(storedTitleHash, titleHash);
        assertEq(storedContentHash, contentHash);
        assertEq(storedPdfHash, pdfHash);
        assertEq(storedOrgHash, orgHash);
        assertGt(timestamp, 0);
        assertGt(uint256(proofHash), 0);
    }
} 