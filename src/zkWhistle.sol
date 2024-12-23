// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

interface IJWTVerifier {
    function verifyProof(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[2] calldata _pubSignals
    ) external view returns (bool);
}

/// @title ZkWhistle
/// @notice Anonymous whistleblowing system using ZK proofs
/// @dev Uses zk-email for JWT verification
contract ZkWhistle is Initializable, Ownable, ReentrancyGuard, Pausable {
    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/
    error InvalidProof();
    error ExpiredJWT();
    error UnauthorizedWhistleblower();
    error InvalidReportData();

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/
    event WhistleblowerVerified(address indexed whistleblower, bytes32 indexed organizationHash);
    event ReportSubmitted(uint256 indexed reportId, bytes32 indexed organizationHash, uint256 timestamp);
    
    /*//////////////////////////////////////////////////////////////
                                 STRUCTS
    //////////////////////////////////////////////////////////////*/
    struct Report {
        bytes32 titleHash;      // Hash of encrypted title
        bytes32 contentHash;    // Hash of encrypted content
        bytes32 pdfHash;        // IPFS hash of evidence
        bytes32 organizationHash; // Hash of organization
        uint256 timestamp;
        bytes32 proofHash;      // Hash of the ZK proof
    }

    /*//////////////////////////////////////////////////////////////
                                 STORAGE
    //////////////////////////////////////////////////////////////*/
    mapping(address => bool) public verifiedWhistleblowers;
    mapping(uint256 => Report) public reports;
    uint256 public reportCount;

    // Verifier contract
    IJWTVerifier public verifier;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _verifier) public initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        __Pausable_init();
        verifier = IJWTVerifier(_verifier);
    }

    /*//////////////////////////////////////////////////////////////
                              CORE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Verify a whistleblower using JWT proof
    /// @param a Proof parameter A
    /// @param b Proof parameter B
    /// @param c Proof parameter C
    /// @param input Public inputs (organization hash and expiration)
    function verifyWhistleblower(
        uint[2] calldata a,
        uint[2][2] calldata b, 
        uint[2] calldata c,
        uint[2] calldata input
    ) public whenNotPaused {
        // Verify expiration
        if (input[1] <= block.timestamp) revert ExpiredJWT();
        
        // Verify the proof
        if (!verifier.verifyProof(a, b, c, input)) revert InvalidProof();
        
        // Mark whistleblower as verified
        verifiedWhistleblowers[msg.sender] = true;
        
        // Emit event with organization hash
        emit WhistleblowerVerified(msg.sender, bytes32(uint256(input[0])));
    }

    /// @notice Submit a whistleblower report
    /// @param titleHash Hash of encrypted title
    /// @param contentHash Hash of encrypted content
    /// @param pdfHash IPFS hash of evidence
    /// @param organizationHash Hash of organization
    function submitReport(
        bytes32 titleHash,
        bytes32 contentHash,
        bytes32 pdfHash,
        bytes32 organizationHash
    ) external whenNotPaused nonReentrant returns (uint256) {
        if (!verifiedWhistleblowers[msg.sender]) revert UnauthorizedWhistleblower();
        if (titleHash == bytes32(0) || contentHash == bytes32(0)) revert InvalidReportData();
        
        uint256 reportId = reportCount++;
        reports[reportId] = Report({
            titleHash: titleHash,
            contentHash: contentHash,
            pdfHash: pdfHash,
            organizationHash: organizationHash,
            timestamp: block.timestamp,
            proofHash: keccak256(abi.encodePacked(msg.sender, block.timestamp))
        });

        emit ReportSubmitted(reportId, organizationHash, block.timestamp);
        return reportId;
    }

    /*//////////////////////////////////////////////////////////////
                              ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Update the verifier contract address
    /// @param _verifier New verifier address
    function updateVerifier(address _verifier) external onlyOwner {
        verifier = IJWTVerifier(_verifier);
    }

    /// @notice Pause the contract
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause the contract
    function unpause() external onlyOwner {
        _unpause();
    }
}
