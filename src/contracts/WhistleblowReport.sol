// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./JwtVerifier.sol";

contract WhistleblowReport {
    struct Report {
        string title;
        string content;
        uint256 timestamp;
        uint256 organizationHash;
    }

    // Store reports by ID
    mapping(uint256 => Report) public reports;
    uint256 public reportCount;

    // Reference to the JWT verifier contract
    JwtVerifier public immutable verifier;

    event ReportSubmitted(
        uint256 indexed reportId,
        uint256 indexed organizationHash,
        uint256 timestamp
    );

    constructor(address _verifier) {
        verifier = JwtVerifier(_verifier);
    }

    function submitReport(
        string calldata _title,
        string calldata _content
    ) external returns (uint256) {
        // Check if sender is verified
        uint256 orgHash = verifier.getVerifiedOrganization(msg.sender);
        require(orgHash != 0, "Sender not verified");

        uint256 reportId = reportCount++;
        
        reports[reportId] = Report({
            title: _title,
            content: _content,
            timestamp: block.timestamp,
            organizationHash: orgHash
        });

        emit ReportSubmitted(
            reportId,
            orgHash,
            block.timestamp
        );

        return reportId;
    }

    function getReport(uint256 _reportId) external view returns (Report memory) {
        return reports[_reportId];
    }
} 