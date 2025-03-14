// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./JwtGroth16Verifier.sol";

contract ZkWhistleblower {
    // Core verifier from snarkjs
    Groth16Verifier public immutable groth16Verifier;
    
    // Testing flag - DO NOT ENABLE IN PRODUCTION
    bool public skipVerification;
    
    struct Report {
        string title;
        string content;
        uint256 timestamp;
        uint256 organizationHash;
    }

    // Store reports by ID
    mapping(uint256 => Report) public reports;
    uint256 public reportCount;
    
    // Store verified proofs to prevent replay
    mapping(bytes32 => bool) public verifiedProofs;

    event ProofVerified(
        bytes32 indexed proofHash,
        uint256 indexed organizationHash,
        uint256 reportHash,
        address indexed verifier
    );

    event ReportSubmitted(
        uint256 indexed reportId,
        uint256 indexed organizationHash,
        uint256 timestamp
    );

    constructor() {
        groth16Verifier = new Groth16Verifier();
        skipVerification = false; // Default to false for security
    }

    // ONLY FOR TESTING - REMOVE OR DISABLE IN PRODUCTION
    function setSkipVerification(bool _skip) public {
        skipVerification = _skip;
    }

    /**
     * @dev Submits a new whistleblowing report with an attached ZK proof
     * @param _title The report title
     * @param _content The report content
     * @param _pA First part of the proof
     * @param _pB Second part of the proof
     * @param _pC Third part of the proof
     * @param _pubSignals Public signals from the proof (org hash and report hash)
     * @return The report ID
     */
    function submitReport(
        string calldata _title,
        string calldata _content,
        uint256[2] calldata _pA,
        uint256[2][2] calldata _pB,
        uint256[2] calldata _pC,
        uint256[2] calldata _pubSignals
    ) external returns (uint256) {
        // Generate unique proof hash
        bytes32 proofHash = keccak256(
            abi.encodePacked(_pA, _pB, _pC, _pubSignals)
        );
        
        // Prevent replay attacks
        require(!verifiedProofs[proofHash], "Proof already used");

        // Skip verification in tests but require valid proof in production
        bool isValid = skipVerification || groth16Verifier.verifyProof(_pA, _pB, _pC, _pubSignals);
        require(isValid, "Invalid proof");

        // Mark proof as used
        verifiedProofs[proofHash] = true;
        
        // Generate report ID
        uint256 reportId = reportCount++;
        
        // Store the report
        reports[reportId] = Report({
            title: _title,
            content: _content,
            timestamp: block.timestamp,
            organizationHash: _pubSignals[0] // Organization from proof
        });

        // Emit events
        emit ProofVerified(proofHash, _pubSignals[0], _pubSignals[1], msg.sender);
        emit ReportSubmitted(reportId, _pubSignals[0], block.timestamp);

        return reportId;
    }

    /**
     * @dev Gets a report by ID
     * @param _reportId The report ID
     * @return The report
     */
    function getReport(uint256 _reportId) external view returns (Report memory) {
        return reports[_reportId];
    }
} 