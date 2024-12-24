pragma circom 2.1.9;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/bitify.circom";
include "@zk-email/jwt-tx-builder-circuits/jwt-verifier.circom";
include "./helpers/extract-domain.circom";

template EmailWhistleblower(max_header_bytes, max_payload_bytes) {
    // Basic JWT verification inputs
    signal input message[max_header_bytes + max_payload_bytes];
    signal input messageLength;
    signal input pubkey[17];
    signal input signature[17];
    signal input periodIndex;
    
    // Email domain extraction inputs
    signal input emailDomainIndex;    // Index where domain starts in email
    signal input emailDomainLength;   // Length of the domain
    
    // Outputs
    signal output organization_hash;
    signal output exp_timestamp;
    
    // Constants
    var EMAIL_MAX_BYTES = 256;  // Adjust based on your needs
    var DOMAIN_MAX_BYTES = 64;  // Adjust based on your needs
    var POSEIDON_INPUT_SIZE = 16; // Maximum inputs for Poseidon
    
    // Declare all components at root scope
    component jwt = JWTVerifier(
        121,                            // n - bits per chunk (must be < 127)
        17,                             // k - number of chunks (121 * 17 = 2057 > 2048)
        max_header_bytes + max_payload_bytes,  // maxMessageLength
        max_header_bytes,               // maxB64HeaderLength
        max_payload_bytes               // maxB64PayloadLength
    );
    component emailToBytes = Num2Bits(EMAIL_MAX_BYTES * 8);
    component domainExtractor = ExtractDomainFromEmail(EMAIL_MAX_BYTES, DOMAIN_MAX_BYTES);
    
    var numChunks = (DOMAIN_MAX_BYTES + POSEIDON_INPUT_SIZE - 1) \ POSEIDON_INPUT_SIZE;
    component chunkHashers[numChunks];
    component combiners[numChunks - 1];
    signal intermediateHashes[numChunks];
    
    // Initialize all Poseidon components
    for (var i = 0; i < numChunks; i++) {
        chunkHashers[i] = Poseidon(POSEIDON_INPUT_SIZE);
    }
    for (var i = 0; i < numChunks - 1; i++) {
        combiners[i] = Poseidon(2);
    }
    
    // Connect JWT verification inputs
    jwt.message <== message;
    jwt.messageLength <== messageLength;
    jwt.pubkey <== pubkey;
    jwt.signature <== signature;
    jwt.periodIndex <== periodIndex;

    // Convert JWT payload to bytes
    emailToBytes.in <== jwt.payload[0];
    
    // Convert bits to bytes and assign to email input
    for (var i = 0; i < EMAIL_MAX_BYTES; i++) {
        var byteVal = 0;
        var pow = 1;
        for (var j = 0; j < 8; j++) {
            byteVal += emailToBytes.out[i * 8 + j] * pow;
            pow *= 2;
        }
        domainExtractor.email[i] <== byteVal;
    }
    
    domainExtractor.emailDomainIndex <== emailDomainIndex;
    domainExtractor.emailDomainLength <== emailDomainLength;

    // Hash domain name in chunks
    for (var i = 0; i < numChunks; i++) {
        for (var j = 0; j < POSEIDON_INPUT_SIZE; j++) {
            var idx = i * POSEIDON_INPUT_SIZE + j;
            if (idx < DOMAIN_MAX_BYTES) {
                chunkHashers[i].inputs[j] <== domainExtractor.domainName[idx];
            } else {
                chunkHashers[i].inputs[j] <== 0;
            }
        }
        
        if (i == 0) {
            intermediateHashes[i] <== chunkHashers[i].out;
        } else {
            combiners[i-1].inputs[0] <== intermediateHashes[i-1];
            combiners[i-1].inputs[1] <== chunkHashers[i].out;
            intermediateHashes[i] <== combiners[i-1].out;
        }
    }
    
    organization_hash <== intermediateHashes[numChunks-1];
    exp_timestamp <== jwt.payload[1];
}

component main = EmailWhistleblower(256, 512);
