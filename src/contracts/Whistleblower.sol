// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {Groth16Verifier} from "./Verifier.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Whistleblower is ReentrancyGuard, Ownable {
    Groth16Verifier public immutable verifier;
    
    // Constants
    uint256 constant VERIFICATION_WINDOW = 1 weeks;
    uint256 constant PROOF_TIME_BUFFER = 1 hours;
    
    // Maps: organization hash => array of reports
    mapping(uint256 => Report[]) public reports;
    
    // Maps: reporter address => organization hash => expiry timestamp
    mapping(address => mapping(uint256 => uint256)) public verifiedReporters;
    
    struct Report {
        bytes32 reportHash;        // Hash of the report content
        uint256 timestamp;         // When the report was submitted
        string title;             // Report title
        string content;           // Report content
        address submitter;        // Address that submitted the report
    }
    
    event ReporterVerified(
        address indexed reporter,
        uint256 indexed organizationHash
    );

    event ReportSubmitted(
        uint256 indexed organizationHash,
        bytes32 reportHash,
        uint256 timestamp,
        address indexed submitter
    );
    
    bool public testMode;
    
    constructor(address _verifierAddress) {
        verifier = Groth16Verifier(_verifierAddress);
    }
    
    function setTestMode(bool _enabled) public onlyOwner {
        testMode = _enabled;
    }
    
    function verifyProofAndRegister(
        uint256[2] memory pA,
        uint256[2][2] memory pB,
        uint256[2] memory pC,
        uint256[2] memory pubSignals  // [organizationHash, timestamp]
    ) public nonReentrant returns (bool) {
        require(
            verifier.verifyProof(pA, pB, pC, pubSignals),
            "Invalid proof"
        );
        
        if (!testMode) {
            require(
                pubSignals[1] >= block.timestamp - PROOF_TIME_BUFFER && 
                pubSignals[1] <= block.timestamp + PROOF_TIME_BUFFER,
                "Proof expired"
            );
        }
        
        verifiedReporters[msg.sender][pubSignals[0]] = block.timestamp + VERIFICATION_WINDOW;
        emit ReporterVerified(msg.sender, pubSignals[0]);
        return true;
    }
    
    function submitReport(
        uint256 organizationHash,
        string calldata title,
        string calldata content
    ) public nonReentrant {
        require(
            verifiedReporters[msg.sender][organizationHash] > block.timestamp,
            "Proof expired or not verified"
        );
        
        bytes32 reportHash = keccak256(abi.encodePacked(title, content));
        
        reports[organizationHash].push(Report({
            reportHash: reportHash,
            timestamp: block.timestamp,
            title: title,
            content: content,
            submitter: msg.sender
        }));
        
        emit ReportSubmitted(
            organizationHash,
            reportHash,
            block.timestamp,
            msg.sender
        );
    }
    
    function getReports(uint256 organizationHash) 
        public 
        view 
        returns (Report[] memory) 
    {
        return reports[organizationHash];
    }
    
    function getReportCount(uint256 organizationHash) 
        public 
        view 
        returns (uint256) 
    {
        return reports[organizationHash].length;
    }
}