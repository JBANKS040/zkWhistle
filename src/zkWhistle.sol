// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";

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

    // Verifier contract address
    address public verifier;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _verifier) public initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        __Pausable_init();
        verifier = _verifier;
    }

    /*//////////////////////////////////////////////////////////////
                              CORE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Verify a whistleblower using JWT proof
    /// @param proof The ZK proof of JWT validity
    /// @param publicInputs Public inputs for proof verification
    function verifyWhistleblower(
        bytes calldata proof,
        uint256[] calldata publicInputs
    ) external whenNotPaused nonReentrant returns (bool) {
        // Verify the proof using the verifier contract
        (bool success, ) = verifier.staticcall(
            abi.encodeWithSignature(
                "verifyProof(bytes,uint256[])",
                proof,
                publicInputs
            )
        );
        
        if (!success) revert InvalidProof();

        // Extract expiry from public inputs
        uint256 expiry = publicInputs[0];
        if (block.timestamp > expiry) revert ExpiredJWT();

        verifiedWhistleblowers[msg.sender] = true;
        emit WhistleblowerVerified(msg.sender, bytes32(publicInputs[1]));
        return true;
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
        verifier = _verifier;
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
