// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {Groth16Verifier} from "./Verifier.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Whistleblower is ReentrancyGuard, Ownable {
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
    
    bool public testMode;
    
    constructor(address _verifierAddress) {
        verifier = Groth16Verifier(_verifierAddress);
    }
    
    function setTestMode(bool _enabled) public onlyOwner {
        testMode = _enabled;
    }
    
    function submitReport(
        uint256[2] memory pA,
        uint256[2][2] memory pB,
        uint256[2] memory pC,
        uint256[2] memory pubSignals,
        bytes memory encryptedData
    ) public {
        require(
            verifier.verifyProof(pA, pB, pC, pubSignals),
            "Invalid proof"
        );
        
        if (!testMode) {
            require(
                pubSignals[1] >= block.timestamp - 1 hours && 
                pubSignals[1] <= block.timestamp + 1 hours,
                "Proof expired or invalid timestamp"
            );
        }
        
        reports[pubSignals[0]].push(Report({
            reportHash: keccak256(encryptedData),
            timestamp: block.timestamp,
            encryptedData: encryptedData,
            title: "",
            content: "",
            ipfsHash: ""
        }));
        
        emit ReportSubmitted(pubSignals[0], reports[pubSignals[0]][reports[pubSignals[0]].length - 1].reportHash, block.timestamp, "");
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
        
        if (!testMode) {
            require(
                expTimestamp >= block.timestamp - 1 hours && 
                expTimestamp <= block.timestamp + 1 hours,
                "Proof expired or invalid timestamp"
            );
        }
        
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