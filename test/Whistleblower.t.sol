// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/contracts/Whistleblower.sol";
import "../src/contracts/Verifier.sol";

contract WhistleblowerTest is Test {
    Whistleblower public whistleblower;
    Groth16Verifier public verifier;
    
    // Real proof values from our script
    uint[2] samplePA = [
        0x064376d82e995d4e94d30e8b0a78b0adc30afe39d75669c7953abb476c0c25c8,
        0x16e995a3641d602d2b2d960cf72e6d8652a9acdaae61f1c973998d3d238218f6
    ];
    uint[2][2] samplePB = [[
        0x2ea304815dbd09b10d2613a6dc5d485e9f16bb3b7679c11b90e5a4381a5c454b,
        0x18637ef45c799f92ef07c29e6ff4604b2599ff256758680238093466b1b9c6d7
    ], [
        0x1f0b38680e8c636697635732a1984f2783dc5ee109392b26db5033bd27434cde,
        0x1588f84e64fa8f2667973b92457c8652b5c8529f9e1645ad67c8548c1dc78d38
    ]];
    uint[2] samplePC = [
        0x26e9a1a1ecbec5d3ce32da7413e9ac15e8e7c10ed9abd5103d0fad8226fbed49,
        0x157cfc6b806a6166ee29b3a19282ab3bd09cfbdc13f015fcdf413a95de563f1e
    ];
    uint[2] samplePubSignals = [
        0x18e202334eb1c6e82a4ec5dc0ea49f4b4a50473cf736d42cd2de3652697d1b66,
        0x0000000000000000000000000000000000000000000000000000000000000022
    ];
    
    bytes sampleEncryptedData = "encrypted";
    string sampleTitle = "Test Report";
    string sampleContent = "Test Content";
    string sampleIpfsHash = "QmTest";

    event ReportSubmitted(
        uint256 indexed organizationHash,
        bytes32 reportHash,
        uint256 timestamp,
        string ipfsHash
    );

    function setUp() public {
        verifier = new Groth16Verifier();
        whistleblower = new Whistleblower(address(verifier));
    }

    function testVerifierDirectly() public view {
        // Test the verifier directly first
        bool isValid = verifier.verifyProof(
            samplePA,
            samplePB,
            samplePC,
            samplePubSignals
        );
        assertTrue(isValid, "Proof verification failed");
    }

    function testSubmitReport() public {
        // No need for mock calls now, using real proof
        vm.expectEmit(true, true, true, true);
        emit ReportSubmitted(
            samplePubSignals[0],
            keccak256(sampleEncryptedData),
            block.timestamp,
            ""
        );
        
        whistleblower.submitReport(
            samplePA,
            samplePB,
            samplePC,
            samplePubSignals,
            sampleEncryptedData
        );
        
        // Verify report storage
        Whistleblower.Report[] memory reports = whistleblower.getReports(samplePubSignals[0]);
        assertEq(reports.length, 1, "Report not stored");
        assertEq(reports[0].encryptedData, sampleEncryptedData, "Wrong encrypted data");
    }

    function testSubmitReportWithIPFS() public {
        vm.expectEmit(true, true, true, true);
        emit ReportSubmitted(
            samplePubSignals[0],
            keccak256(sampleEncryptedData),
            block.timestamp,
            sampleIpfsHash
        );
        
        whistleblower.submitReportWithIPFS(
            samplePA,
            samplePB,
            samplePC,
            samplePubSignals,
            sampleEncryptedData,
            sampleTitle,
            sampleContent,
            sampleIpfsHash
        );
        
        Whistleblower.Report[] memory reports = whistleblower.getReports(samplePubSignals[0]);
        assertEq(reports.length, 1, "Report not stored");
        assertEq(reports[0].title, sampleTitle, "Wrong title");
        assertEq(reports[0].content, sampleContent, "Wrong content");
        assertEq(reports[0].ipfsHash, sampleIpfsHash, "Wrong IPFS hash");
    }

    function testExpiredJWT() public {
        // Note: Our real proof has timestamp 34 (0x22)
        // We need to ensure block.timestamp makes this expired
        vm.warp(35); // Set block timestamp after expiration
        
        vm.expectRevert("JWT expired");
        whistleblower.submitReport(
            samplePA,
            samplePB,
            samplePC,
            samplePubSignals,
            sampleEncryptedData
        );
    }
}
