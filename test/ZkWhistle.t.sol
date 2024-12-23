// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test} from "forge-std/Test.sol";
import {ZkWhistle} from "../src/zkWhistle.sol";

// Mock verifier for testing
contract MockJWTVerifier is IJWTVerifier {
    bool public shouldVerify = true;

    function setShouldVerify(bool _shouldVerify) external {
        shouldVerify = _shouldVerify;
    }

    function verifyProof(
        uint[2] calldata,
        uint[2][2] calldata,
        uint[2] calldata,
        uint[2] calldata
    ) external view returns (bool) {
        return shouldVerify;
    }
}

contract ZkWhistleTest is Test {
    ZkWhistle public whistleBlower;
    MockJWTVerifier public verifier;

    // Test data
    bytes32 public constant TITLE_HASH = bytes32(uint256(1));
    bytes32 public constant CONTENT_HASH = bytes32(uint256(2));
    bytes32 public constant PDF_HASH = bytes32(uint256(3));
    bytes32 public constant ORG_HASH = bytes32(uint256(4));

    // Events to test
    event WhistleblowerVerified(address indexed whistleblower, bytes32 indexed organizationHash);
    event ReportSubmitted(uint256 indexed reportId, bytes32 indexed organizationHash, uint256 timestamp);

    function setUp() public {
        // Deploy mock verifier
        verifier = new MockJWTVerifier();
        
        // Deploy main contract
        whistleBlower = new ZkWhistle();
        whistleBlower.initialize(address(verifier));
    }

    function test_verifyWhistleblower() public {
        // Create dummy proof data
        uint[2] memory a = [uint(1), uint(2)];
        uint[2][2] memory b = [[uint(3), uint(4)], [uint(5), uint(6)]];
        uint[2] memory c = [uint(7), uint(8)];
        uint[2] memory input = [uint(9), block.timestamp + 1 hours];

        // Expect event emission
        vm.expectEmit(true, true, false, true);
        emit WhistleblowerVerified(address(this), bytes32(uint256(9)));

        // Verify whistleblower
        whistleBlower.verifyWhistleblower(a, b, c, input);

        // Check if whistleblower is verified
        assertTrue(whistleBlower.verifiedWhistleblowers(address(this)));
    }

    function test_submitReport() public {
        // First verify the whistleblower
        uint[2] memory a = [uint(1), uint(2)];
        uint[2][2] memory b = [[uint(3), uint(4)], [uint(5), uint(6)]];
        uint[2] memory c = [uint(7), uint(8)];
        uint[2] memory input = [uint(9), block.timestamp + 1 hours];
        whistleBlower.verifyWhistleblower(a, b, c, input);

        // Expect event emission
        vm.expectEmit(true, true, false, true);
        emit ReportSubmitted(0, ORG_HASH, block.timestamp);

        // Submit report
        uint256 reportId = whistleBlower.submitReport(
            TITLE_HASH,
            CONTENT_HASH,
            PDF_HASH,
            ORG_HASH
        );

        // Verify report data
        (
            bytes32 titleHash,
            bytes32 contentHash,
            bytes32 pdfHash,
            bytes32 organizationHash,
            uint256 timestamp,
            bytes32 proofHash
        ) = whistleBlower.reports(reportId);

        assertEq(titleHash, TITLE_HASH);
        assertEq(contentHash, CONTENT_HASH);
        assertEq(pdfHash, PDF_HASH);
        assertEq(organizationHash, ORG_HASH);
        assertEq(timestamp, block.timestamp);
        assertEq(proofHash, keccak256(abi.encodePacked(address(this), block.timestamp)));
    }

    function testFail_verifyExpiredJWT() public {
        uint[2] memory a = [uint(1), uint(2)];
        uint[2][2] memory b = [[uint(3), uint(4)], [uint(5), uint(6)]];
        uint[2] memory c = [uint(7), uint(8)];
        uint[2] memory input = [uint(9), block.timestamp - 1]; // Expired timestamp

        whistleBlower.verifyWhistleblower(a, b, c, input);
    }

    function testFail_submitReportUnverified() public {
        // Try to submit without verification
        whistleBlower.submitReport(
            TITLE_HASH,
            CONTENT_HASH,
            PDF_HASH,
            ORG_HASH
        );
    }

    function test_adminFunctions() public {
        // Test pause
        whistleBlower.pause();
        assertTrue(whistleBlower.paused());

        // Test unpause
        whistleBlower.unpause();
        assertFalse(whistleBlower.paused());

        // Test verifier update
        address newVerifier = address(0x123);
        whistleBlower.updateVerifier(newVerifier);
        assertEq(address(whistleBlower.verifier()), newVerifier);
    }

    function test_initialization() public {
        assertEq(address(whistleBlower.verifier()), address(verifier));
        assertEq(whistleBlower.owner(), address(this));
        assertFalse(whistleBlower.paused());
    }

    function testFail_reinitialize() public {
        whistleBlower.initialize(address(verifier));
    }

    function test_verifyWhistleblowerWhenPaused() public {
        whistleBlower.pause();
        
        uint[2] memory a = [uint(1), uint(2)];
        uint[2][2] memory b = [[uint(3), uint(4)], [uint(5), uint(6)]];
        uint[2] memory c = [uint(7), uint(8)];
        uint[2] memory input = [uint(9), block.timestamp + 1 hours];

        vm.expectRevert("Pausable: paused");
        whistleBlower.verifyWhistleblower(a, b, c, input);
    }

    function test_submitReportWhenPaused() public {
        // First verify the whistleblower
        uint[2] memory a = [uint(1), uint(2)];
        uint[2][2] memory b = [[uint(3), uint(4)], [uint(5), uint(6)]];
        uint[2] memory c = [uint(7), uint(8)];
        uint[2] memory input = [uint(9), block.timestamp + 1 hours];
        whistleBlower.verifyWhistleblower(a, b, c, input);

        // Pause the contract
        whistleBlower.pause();

        // Try to submit when paused
        vm.expectRevert("Pausable: paused");
        whistleBlower.submitReport(
            TITLE_HASH,
            CONTENT_HASH,
            PDF_HASH,
            ORG_HASH
        );
    }

    function testFail_submitReportWithInvalidData() public {
        // First verify the whistleblower
        uint[2] memory a = [uint(1), uint(2)];
        uint[2][2] memory b = [[uint(3), uint(4)], [uint(5), uint(6)]];
        uint[2] memory c = [uint(7), uint(8)];
        uint[2] memory input = [uint(9), block.timestamp + 1 hours];
        whistleBlower.verifyWhistleblower(a, b, c, input);

        // Try to submit with empty title hash
        whistleBlower.submitReport(
            bytes32(0),
            CONTENT_HASH,
            PDF_HASH,
            ORG_HASH
        );
    }

    function test_onlyOwnerFunctions() public {
        address newOwner = address(0x123);
        address newVerifier = address(0x456);

        // Test ownership transfer
        whistleBlower.transferOwnership(newOwner);
        assertEq(whistleBlower.owner(), newOwner);

        // Test verifier update permissions
        vm.prank(address(0x789));
        vm.expectRevert("Ownable: caller is not the owner");
        whistleBlower.updateVerifier(newVerifier);
    }
} 