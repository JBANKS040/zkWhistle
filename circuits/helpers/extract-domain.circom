pragma circom 2.1.9;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/mux1.circom";

template ExtractDomain(maxLength, emailLength) {
    signal input email[1026];        
    signal input domainIndex;       
    signal input domainLength;      
    signal output domain_hash;      
    
    // Create array to store domain characters
    signal domain[maxLength];
    component selectors[maxLength];
    
    // Extract domain characters
    for (var i = 0; i < maxLength; i++) {
        selectors[i] = Mux1();
        selectors[i].c[0] <== 0;
        selectors[i].c[1] <== email[i];
        selectors[i].s <== LessThan(252)([i - domainIndex, domainLength]);
        domain[i] <== selectors[i].out;
    }
    
    // Hash in chunks of 15 (max input size for Poseidon)
    var numChunks = (maxLength + 14) \ 15; // Integer division rounding up
    component hashers[numChunks];
    signal intermediateHashes[numChunks];
    
    for (var i = 0; i < numChunks; i++) {
        hashers[i] = Poseidon(15);
        for (var j = 0; j < 15; j++) {
            if (i * 15 + j < maxLength) {
                hashers[i].inputs[j] <== domain[i * 15 + j];
            } else {
                hashers[i].inputs[j] <== 0;
            }
        }
        intermediateHashes[i] <== hashers[i].out;
    }
    
    // Final hash of all intermediate hashes
    component finalHasher = Poseidon(numChunks);
    for (var i = 0; i < numChunks; i++) {
        finalHasher.inputs[i] <== intermediateHashes[i];
    }
    
    domain_hash <== finalHasher.out;
}