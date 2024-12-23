pragma circom 2.1.9;

include "../lib/jwt-tx-builder/packages/circuits/jwt-verifier.circom";
include "../lib/circomlib/circuits/poseidon.circom";

template JWTWhistleblower(max_header_bytes, max_payload_bytes) {
    // Basic JWT verification inputss
    signal input message[max_header_bytes + max_payload_bytes];
    signal input messageLength;
    signal input pubkey[17];
    signal input signature[17];
    signal input periodIndex;

    signal output organization_hash;
    signal output exp_timestamp;
    
    // JWT verification component with correct parameters from implementation
    component jwt = JWTVerifier(
        121,                            // n - bits per chunk (must be < 127)
        17,                            // k - number of chunks (121 * 17 = 2057 > 2048)
        max_header_bytes + max_payload_bytes,  // maxMessageLength
        max_header_bytes,              // maxB64HeaderLength
        max_payload_bytes              // maxB64PayloadLength
    );
    
    // Connect basic inputs that match the JWTVerifier interface
    jwt.message <== message;
    jwt.messageLength <== messageLength;
    jwt.pubkey <== pubkey;
    jwt.signature <== signature;
    jwt.periodIndex <== periodIndex;

    // Extract organization from decoded payload and hash it
    component orgHasher = Poseidon(1);
    orgHasher.inputs[0] <== jwt.payload[0];
    organization_hash <== orgHasher.out;

    // Extract expiration timestamp from payload
    exp_timestamp <== jwt.payload[1];
}

component main = JWTWhistleblower(256, 512);
