// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/contracts/WhistleblowReport.sol";
import "../src/contracts/JwtVerifier.sol";

contract WhistleblowReportTest is Test {
    WhistleblowReport public whistleblowReport;
    JwtVerifier public jwtVerifier;
    string constant TEST_ORG_NAME = "test.org";
    
    // Test proof data - same as in JwtVerifier.t.sol
    uint256[2] validProofA = [
        15269374003254042663587020057992194721988202033255293813853618689270801876586,
        15735222871362906836486195132735948210017087169977726954061667599300593470158
    ];
    
    uint256[2][2] validProofB = [
        [
            11249990064494531792731359974375306715298171616988493353397867102124807443201,
            18670803821818854266223761861946475283891891586196719299814871795322846070085
        ],
        [
            1064483130261623663823017191446520051955574172885444437339292271509148563180,
            5236245064026034443438798023661612710420907888395624530548883294998934691565
        ]
    ];
    
    uint256[2] validProofC = [
        7541426962326465942530874034019350374404636546998991503696342518717138733281,
        13064591525137848853506533267583424059501542529030280182915684685104220955580
    ];
    
    uint256[1] validPubSignals = [
        21061343116936272860517744458130484610563107634320271795239076069837686875986
    ];

    function setUp() public {
        // Deploy verifier first
        jwtVerifier = new JwtVerifier();
        // Deploy report contract with verifier address
        whistleblowReport = new WhistleblowReport(address(jwtVerifier));
    }

    function testSubmitReport() public {
        // First verify the organization
        jwtVerifier.verifyProof(
            validProofA,
            validProofB,
            validProofC,
            validPubSignals,
            TEST_ORG_NAME
        );

        // Submit a report
        string memory title = "Test Report";
        string memory content = "Test Content";
        uint256 reportId = whistleblowReport.submitReport(title, content);

        // Verify report data
        WhistleblowReport.Report memory report = whistleblowReport.getReport(reportId);
        assertEq(report.title, title);
        assertEq(report.content, content);
        assertEq(report.organizationHash, validPubSignals[0]);
    }

    function testUnverifiedSubmission() public {
        // Try to submit without verification
        vm.expectRevert("Sender not verified");
        whistleblowReport.submitReport("Test", "Content");
    }

    function testReportCount() public {
        // Verify first
        jwtVerifier.verifyProof(
            validProofA,
            validProofB,
            validProofC,
            validPubSignals,
            TEST_ORG_NAME
        );

        // Submit reports and check count
        whistleblowReport.submitReport("Test 1", "Content 1");
        assertEq(whistleblowReport.reportCount(), 1);
        
        whistleblowReport.submitReport("Test 2", "Content 2");
        assertEq(whistleblowReport.reportCount(), 2);
    }
} 