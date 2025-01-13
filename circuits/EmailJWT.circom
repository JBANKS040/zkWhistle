pragma circom 2.1.9;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/bitify.circom";
include "circomlib/circuits/comparators.circom";
include "@zk-email/jwt-tx-builder-circuits/jwt-verifier.circom";
include "./helpers/extract-domain.circom";

template EmailWhistleblower() {
    // Input signals
    signal input message[2048];  
    signal input messageLength;
    signal input pubkey[17];     
    signal input signature[17];  
    signal input periodIndex;    
    signal input emailDomainIndex;  
    signal input emailDomainLength; 
    signal input jwt_exp;        
    signal input proof_exp;      
    signal input current_time;   
    
    // Output signals
    signal output organization_hash;
    signal output proof_expiry;     
    
    // Calculate exact Base64 dimensions
    var maxB64PayloadLength = 1368;  // Next multiple of 4 after 1366
    var maxPayloadLength = 1024;     // Desired decoded length
    
    // JWT verification component
    component jwt = JWTVerifier(
        121,    // n - bits per chunk
        17,     // k - number of chunks
        2048,   // maxMessageLength
        344,    // maxB64HeaderLength
        1368    // maxB64PayloadLength - must be multiple of 4
    );
    
    // Connect JWT verifier inputs
    jwt.message <== message;
    jwt.messageLength <== messageLength;
    jwt.pubkey <== pubkey;
    jwt.signature <== signature;
    jwt.periodIndex <== periodIndex;
    
    // Verify JWT is not expired at proof generation time
    component timeCheck = LessThan(252);
    timeCheck.in[0] <== current_time;
    timeCheck.in[1] <== jwt_exp;
    timeCheck.out === 1;  // Must be valid when creating proof
    
    // Extract domain using increased payload length
    component domainExtractor = ExtractDomain(64, 1024);
    domainExtractor.email <== jwt.payload;
    domainExtractor.domainIndex <== emailDomainIndex;
    domainExtractor.domainLength <== emailDomainLength;
    
    // Connect outputs
    organization_hash <== domainExtractor.domain_hash;
    proof_expiry <== proof_exp;  // Use independent proof expiration
}

component main = EmailWhistleblower();
