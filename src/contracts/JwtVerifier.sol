// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./JwtGroth16Verifier.sol";

contract JwtVerifier {
    Groth16Verifier public immutable verifier;
    
    // Event emitted when a proof is verified, including the organization hash
    event ProofVerified(
        bytes32 indexed proofHash,
        uint256 indexed organizationHash,
        address indexed verifier
    );

    // Store verified proofs to prevent replay
    mapping(bytes32 => bool) public verifiedProofs;
    
    // Map addresses to their verified organization hash
    mapping(address => uint256) public addressToOrganization;

    // Add this mapping
    mapping(uint256 => string) public organizationNames;

    constructor() {
        verifier = new Groth16Verifier();
    }

    function verifyProof(
        uint256[2] calldata _pA,
        uint256[2][2] calldata _pB,
        uint256[2] calldata _pC,
        uint256[1] calldata _pubSignals,
        string calldata _organizationName
    ) external returns (bool) {
        // Generate unique proof hash
        bytes32 proofHash = keccak256(
            abi.encodePacked(_pA, _pB, _pC, _pubSignals)
        );
        
        // Prevent replay attacks
        require(!verifiedProofs[proofHash], "Proof already used");

        // Verify the proof using the verifier contract
        bool isValid = verifier.verifyProof(_pA, _pB, _pC, _pubSignals);
        require(isValid, "Invalid proof");

        // Mark proof as used
        verifiedProofs[proofHash] = true;

        // Store the organization hash for the sender
        addressToOrganization[msg.sender] = _pubSignals[0];

        // Store the actual organization name from the proof
        organizationNames[_pubSignals[0]] = _organizationName;

        // Emit event with proof hash, organization hash, and verifier address
        emit ProofVerified(proofHash, _pubSignals[0], msg.sender);

        return true;
    }

    // View function to get verified organization for an address
    function getVerifiedOrganization(address user) external view returns (uint256) {
        return addressToOrganization[user];
    }

    // Add a function to get the name
    function getOrganizationName(uint256 organizationHash) public view returns (string memory) {
        string memory name = organizationNames[organizationHash];
        return bytes(name).length > 0 ? name : "Unknown Organization";
    }
}
