pragma circom 2.1.9;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/mux1.circom";

template ExtractDomain(maxLength, emailLength) {
    signal input email[1026];        // Match JWT verifier's decoded length
    signal input domainIndex;       
    signal input domainLength;      
    signal output domain_hash;      
    
    // Create array to store domain characters
    signal domain[maxLength];
    component selectors[maxLength];
    
    // For each possible position, use a multiplexer to select the right character
    for (var i = 0; i < maxLength; i++) {
        selectors[i] = Mux1();
        selectors[i].c[0] <== 0;
        selectors[i].c[1] <== email[i];
        selectors[i].s <== LessThan(252)([i - domainIndex, domainLength]);
        domain[i] <== selectors[i].out;
    }
    
    // Use smaller chunks for Poseidon (it supports up to 6 inputs)
    var numChunks = (maxLength + 5) \ 6;
    component hashers[numChunks];
    component finalHasher = Poseidon(numChunks);
    
    for (var i = 0; i < numChunks; i++) {
        hashers[i] = Poseidon(6);
        for (var j = 0; j < 6; j++) {
            if (i * 6 + j < maxLength) {
                hashers[i].inputs[j] <== domain[i * 6 + j];
            } else {
                hashers[i].inputs[j] <== 0;
            }
        }
        finalHasher.inputs[i] <== hashers[i].out;
    }
    
    domain_hash <== finalHasher.out;
}