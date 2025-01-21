// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/contracts/JwtVerifier.sol";

contract JwtVerifierTest is Test {
    JwtVerifier public jwtVerifier;
    
    // Your actual proof data - formatted for the verifier contract
    uint256[2] validProofA = [
        15269374003254042663587020057992194721988202033255293813853618689270801876586,
        15735222871362906836486195132735948210017087169977726954061667599300593470158
    ];
    
    uint256[2][2] validProofB = [
        [
            11249990064494531792731359974375306715298171616988493353397867102124807443201,
            18670803821818854266223761861946475283891891586196719299814871795322846070085
        ],
        [
            1064483130261623663823017191446520051955574172885444437339292271509148563180,
            5236245064026034443438798023661612710420907888395624530548883294998934691565
        ]
    ];
    
    uint256[2] validProofC = [
        7541426962326465942530874034019350374404636546998991503696342518717138733281,
        13064591525137848853506533267583424059501542529030280182915684685104220955580
    ];
    
    uint256[1] validPubSignals = [
        21061343116936272860517744458130484610563107634320271795239076069837686875986
    ];

    event ProofVerified(
        bytes32 indexed proofHash,
        uint256 indexed organizationHash,
        address indexed verifier
    );

    function setUp() public {
        jwtVerifier = new JwtVerifier();
    }

    function testVerifyValidProof() public {
        // Calculate expected proof hash
        bytes32 expectedProofHash = keccak256(
            abi.encodePacked(validProofA, validProofB, validProofC, validPubSignals)
        );

        // Expect the event with correct parameters
        vm.expectEmit(true, true, true, true);
        emit ProofVerified(
            expectedProofHash,
            validPubSignals[0],
            address(this)
        );

        bool success = jwtVerifier.verifyProof(
            validProofA,
            validProofB,
            validProofC,
            validPubSignals
        );
        assertTrue(success, "Proof verification failed");
    }

    function testPreventReplayAttack() public {
        // First verification should succeed
        bool success = jwtVerifier.verifyProof(
            validProofA,
            validProofB,
            validProofC,
            validPubSignals
        );
        assertTrue(success, "First verification failed");

        // Second verification should fail
        vm.expectRevert("Proof already used");
        jwtVerifier.verifyProof(
            validProofA,
            validProofB,
            validProofC,
            validPubSignals
        );
    }

    function testOrganizationTracking() public {
        // Verify proof first
        jwtVerifier.verifyProof(
            validProofA,
            validProofB,
            validProofC,
            validPubSignals
        );

        // Check organization hash is stored correctly
        uint256 verifiedOrg = jwtVerifier.getVerifiedOrganization(address(this));
        assertEq(verifiedOrg, validPubSignals[0], "Organization hash mismatch");
    }

    function testDifferentSignerVerification() public {
        address alice = address(0x1);
        
        // Verify proof as Alice
        vm.prank(alice);
        jwtVerifier.verifyProof(
            validProofA,
            validProofB,
            validProofC,
            validPubSignals
        );

        // Check organization hash is stored correctly for Alice
        uint256 verifiedOrg = jwtVerifier.getVerifiedOrganization(alice);
        assertEq(verifiedOrg, validPubSignals[0], "Organization hash mismatch for different signer");

        // Verify original sender has no organization hash
        uint256 originalSenderOrg = jwtVerifier.getVerifiedOrganization(address(this));
        assertEq(originalSenderOrg, 0, "Original sender should have no organization hash");
    }

    function testVerifiedProofsMapping() public {
        // Calculate proof hash
        bytes32 proofHash = keccak256(
            abi.encodePacked(validProofA, validProofB, validProofC, validPubSignals)
        );

        // Check proof is not verified initially
        assertFalse(jwtVerifier.verifiedProofs(proofHash), "Proof should not be verified initially");

        // Verify proof
        jwtVerifier.verifyProof(
            validProofA,
            validProofB,
            validProofC,
            validPubSignals
        );

        // Check proof is marked as verified
        assertTrue(jwtVerifier.verifiedProofs(proofHash), "Proof should be marked as verified");
    }
} 