pragma circom 2.1.9;

include "../lib/jwt-tx-builder/packages/circuits/jwt-verifier.circom";
include "../lib/circomlib/circuits/poseidon.circom";

template JWTWhistleblower(max_header_bytes, max_payload_bytes) {
    signal input message[max_header_bytes + max_payload_bytes];  // Full JWT message (header.payload)
    signal input messageLength;                                  // Actual length of JWT message
    signal input pubkey[32];                                    // RSA public key (adjusted from 64 to 32)
    signal input signature[32];                                 // RSA signature (adjusted from 64 to 32)
    signal input periodIndex;                                   // Location of '.' in JWT

    signal output organization_hash;
    signal output exp_timestamp;
    
    // JWT verification component
    component jwt = JWTVerifier(
        28,                             // n - bits per chunk
        32,                             // k - number of chunks
        max_header_bytes + max_payload_bytes,
        max_header_bytes,
        max_payload_bytes
    );
    
    // Connect inputs
    jwt.message <== message;
    jwt.messageLength <== messageLength;
    jwt.pubkey <== pubkey;
    jwt.signature <== signature;
    jwt.periodIndex <== periodIndex;

    // Extract organization from decoded payload
    component orgHasher = Poseidon(1);
    orgHasher.inputs[0] <== jwt.payload[0];
    organization_hash <== orgHasher.out;

    // Extract expiration timestamp
    exp_timestamp <== jwt.payload[1];
}

component main = JWTWhistleblower(256, 512);
