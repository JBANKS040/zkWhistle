// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./JwtGroth16Verifier.sol";

contract JwtVerifier is Groth16Verifier {
    event ProofVerified(bytes32 proofHash, bool isValid);
    
    // Store verified proofs to prevent replay
    mapping(bytes32 => bool) public verifiedProofs;
    
    function verifyProofAndStore(
        uint256[2] calldata _pA,
        uint256[2][2] calldata _pB,
        uint256[2] calldata _pC,
        uint256[1] calldata _pubSignals
    ) external returns (bool) {
        // Generate proof hash for replay protection
        bytes32 proofHash = keccak256(abi.encodePacked(_pA, _pB, _pC, _pubSignals));
        require(!verifiedProofs[proofHash], "Proof already used");
        
        // Verify the proof
        bool isValid = verifyProof(_pA, _pB, _pC, _pubSignals);
        
        // If valid, store the proof hash
        if (isValid) {
            verifiedProofs[proofHash] = true;
        }
        
        emit ProofVerified(proofHash, isValid);
        return isValid;
    }
} 