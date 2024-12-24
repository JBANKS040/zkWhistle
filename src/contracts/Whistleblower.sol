// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {Groth16Verifier} from "./Verifier.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Whistleblower is ReentrancyGuard {
    Groth16Verifier public immutable verifier;
    
    mapping(uint256 => Report[]) public reports;
    
    struct Report {
        bytes32 reportHash;
        uint256 timestamp;
        bytes encryptedData;
        string title;
        string content;
        string ipfsHash;
    }
    
    event ReportSubmitted(
        uint256 indexed organizationHash,
        bytes32 reportHash,
        uint256 timestamp,
        string ipfsHash
    );
    
    constructor(address _verifierAddress) {
        verifier = Groth16Verifier(_verifierAddress);
    }
    
    function submitReport(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[2] calldata _pubSignals,
        bytes calldata _encryptedData
    ) external nonReentrant {
        require(
            verifier.verifyProof(_pA, _pB, _pC, _pubSignals),
            "Invalid proof"
        );
        
        uint256 organizationHash = _pubSignals[0];
        uint256 expTimestamp = _pubSignals[1];
        
        require(block.timestamp <= expTimestamp, "JWT expired");
        
        bytes32 reportHash = keccak256(_encryptedData);
        
        reports[organizationHash].push(Report({
            reportHash: reportHash,
            timestamp: block.timestamp,
            encryptedData: _encryptedData,
            title: "",
            content: "",
            ipfsHash: ""
        }));
        
        emit ReportSubmitted(
            organizationHash,
            reportHash,
            block.timestamp,
            ""
        );
    }
    
    function submitReportWithIPFS(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[2] calldata _pubSignals,
        bytes calldata _encryptedData,
        string calldata _title,
        string calldata _content,
        string calldata _ipfsHash
    ) external nonReentrant {
        require(
            verifier.verifyProof(_pA, _pB, _pC, _pubSignals),
            "Invalid proof"
        );
        
        uint256 organizationHash = _pubSignals[0];
        uint256 expTimestamp = _pubSignals[1];
        
        require(block.timestamp <= expTimestamp, "JWT expired");
        
        bytes32 reportHash = keccak256(_encryptedData);
        
        reports[organizationHash].push(Report({
            reportHash: reportHash,
            timestamp: block.timestamp,
            encryptedData: _encryptedData,
            title: _title,
            content: _content,
            ipfsHash: _ipfsHash
        }));
        
        emit ReportSubmitted(
            organizationHash,
            reportHash,
            block.timestamp,
            _ipfsHash
        );
    }
    
    function getReports(uint256 organizationHash) 
        external 
        view 
        returns (Report[] memory) 
    {
        return reports[organizationHash];
    }
    
    function getReportCount(uint256 organizationHash) 
        external 
        view 
        returns (uint256) 
    {
        return reports[organizationHash].length;
    }
}