pragma circom 2.1.9;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/mux1.circom";
include "circomlib/circuits/gates.circom";

// Fixed template with proper signal assignment
template ExtractDomainFromPayload(maxPayloadLength, maxDomainLength) {
    signal input payload[maxPayloadLength];
    signal input emailKeyIndex;  // Position of "email" key in payload
    signal output domain_hash;
    
    // Constants for matching
    var AT_SYMBOL = 64;   // ASCII @ symbol
    var QUOTE = 34;       // ASCII " (double quote)
    
    // Find email value start (after "email":")
    signal emailStartPos;
    emailStartPos <== emailKeyIndex + 9; // "email":" = 8 chars + 1
    
    // ------------------------------------------------------------
    // Part 1: Find positions (unchanged)
    // ------------------------------------------------------------
    
    // Initialize arrays to store positions
    signal atPosition;
    signal emailEndPosition;
    
    // Find @ symbol position - the first @ after emailStartPos
    component atFinder[maxPayloadLength];
    component isAfterStart[maxPayloadLength];
    component notFoundYet[maxPayloadLength]; 
    component shouldUpdate[maxPayloadLength];
    component finalUpdate[maxPayloadLength];
    component atPosUpdater[maxPayloadLength];
    signal atPosTracker[maxPayloadLength+1];
    
    // Start with a position beyond the array length (not found)
    atPosTracker[0] <== maxPayloadLength + 1;
    
    for (var i = 0; i < maxPayloadLength; i++) {
        // Check if character is @ symbol
        atFinder[i] = IsEqual();
        atFinder[i].in[0] <== payload[i];
        atFinder[i].in[1] <== AT_SYMBOL;
        
        // Check if position is after email start
        isAfterStart[i] = GreaterEqThan(32);
        isAfterStart[i].in[0] <== i;
        isAfterStart[i].in[1] <== emailStartPos;
        
        // Update position if this is @ and after start and no previous @ found
        notFoundYet[i] = GreaterThan(32);
        notFoundYet[i].in[0] <== atPosTracker[i];
        notFoundYet[i].in[1] <== maxPayloadLength;
        
        shouldUpdate[i] = AND();
        shouldUpdate[i].a <== atFinder[i].out;
        shouldUpdate[i].b <== isAfterStart[i].out;
        
        finalUpdate[i] = AND(); 
        finalUpdate[i].a <== shouldUpdate[i].out;
        finalUpdate[i].b <== notFoundYet[i].out;
        
        // Update tracking position
        atPosUpdater[i] = Mux1();
        atPosUpdater[i].c[0] <== atPosTracker[i];
        atPosUpdater[i].c[1] <== i;
        atPosUpdater[i].s <== finalUpdate[i].out;
        
        atPosTracker[i+1] <== atPosUpdater[i].out;
    }
    
    // Final @ position
    atPosition <== atPosTracker[maxPayloadLength];
    
    // Find end of email (closing quote) - first quote after @ symbol
    component quoteFinder[maxPayloadLength];
    component isAfterAt[maxPayloadLength];
    component quoteNotFoundYet[maxPayloadLength];
    component shouldUpdateQuote[maxPayloadLength];
    component finalQuoteUpdate[maxPayloadLength];
    component quoteUpdater[maxPayloadLength];
    signal quotePosTracker[maxPayloadLength+1];
    
    // Start with a position beyond the array length (not found)
    quotePosTracker[0] <== maxPayloadLength + 1;
    
    for (var i = 0; i < maxPayloadLength; i++) {
        // Check if character is a quote
        quoteFinder[i] = IsEqual();
        quoteFinder[i].in[0] <== payload[i];
        quoteFinder[i].in[1] <== QUOTE;
        
        // Check if position is after @ symbol
        isAfterAt[i] = GreaterThan(32);
        isAfterAt[i].in[0] <== i;
        isAfterAt[i].in[1] <== atPosition;
        
        // Update position if this is " and after @ and no previous " found
        quoteNotFoundYet[i] = GreaterThan(32);
        quoteNotFoundYet[i].in[0] <== quotePosTracker[i];
        quoteNotFoundYet[i].in[1] <== maxPayloadLength;
        
        shouldUpdateQuote[i] = AND();
        shouldUpdateQuote[i].a <== quoteFinder[i].out;
        shouldUpdateQuote[i].b <== isAfterAt[i].out;
        
        finalQuoteUpdate[i] = AND();
        finalQuoteUpdate[i].a <== shouldUpdateQuote[i].out;
        finalQuoteUpdate[i].b <== quoteNotFoundYet[i].out;
        
        // Update tracking position
        quoteUpdater[i] = Mux1();
        quoteUpdater[i].c[0] <== quotePosTracker[i];
        quoteUpdater[i].c[1] <== i;
        quoteUpdater[i].s <== finalQuoteUpdate[i].out;
        
        quotePosTracker[i+1] <== quoteUpdater[i].out;
    }
    
    // Final quote position
    emailEndPosition <== quotePosTracker[maxPayloadLength];
    
    // ------------------------------------------------------------
    // Part 2: Extract domain with proper accumulation (FIXED)
    // ------------------------------------------------------------
    
    // Calculate domain length (with upper bound)
    signal domainLength;
    component domainLengthCalc = LessThan(32);
    domainLengthCalc.in[0] <== emailEndPosition - atPosition - 1;
    domainLengthCalc.in[1] <== maxDomainLength;
    
    component domainLengthMux = Mux1();
    domainLengthMux.c[0] <== emailEndPosition - atPosition - 1;
    domainLengthMux.c[1] <== maxDomainLength;
    domainLengthMux.s <== 1 - domainLengthCalc.out; // If actual length > maxDomainLength, use maxDomainLength
    
    domainLength <== domainLengthMux.out;
    
    // Extract domain characters with proper accumulation pattern
    signal domainChar[maxDomainLength][maxPayloadLength+1];
    component isInDomainRange[maxPayloadLength];
    component inLoopAfterAt[maxPayloadLength];
    component inLoopBeforeQuote[maxPayloadLength];
    signal domainPos[maxPayloadLength];
    component inLoopValidDomainPos[maxPayloadLength];
    component inLoopShouldKeep[maxPayloadLength];
    component inLoopIsPosJ[maxPayloadLength][maxDomainLength];
    component inLoopFinalCheck[maxPayloadLength][maxDomainLength];
    
    // Initialize accumulation arrays
    for (var i = 0; i < maxDomainLength; i++) {
        domainChar[i][0] <== 0;
    }
    
    // For each position in the payload, check if it's part of the domain
    for (var i = 0; i < maxPayloadLength; i++) {
        // Check if position is in domain range (between atPosition+1 and emailEndPosition-1)
        isInDomainRange[i] = AND();
        
        inLoopAfterAt[i] = GreaterEqThan(32);
        inLoopAfterAt[i].in[0] <== i;
        inLoopAfterAt[i].in[1] <== atPosition + 1;
        
        inLoopBeforeQuote[i] = LessThan(32);
        inLoopBeforeQuote[i].in[0] <== i;
        inLoopBeforeQuote[i].in[1] <== emailEndPosition;
        
        isInDomainRange[i].a <== inLoopAfterAt[i].out;
        isInDomainRange[i].b <== inLoopBeforeQuote[i].out;
        
        // Calculate domain character position (offset from domain start)
        domainPos[i] <== i - (atPosition + 1);
        
        // Valid domain position check (must be < maxDomainLength)
        inLoopValidDomainPos[i] = LessThan(32);
        inLoopValidDomainPos[i].in[0] <== domainPos[i];
        inLoopValidDomainPos[i].in[1] <== maxDomainLength;
        
        // Combined check: is it in domain range AND a valid domain position
        inLoopShouldKeep[i] = AND();
        inLoopShouldKeep[i].a <== isInDomainRange[i].out;
        inLoopShouldKeep[i].b <== inLoopValidDomainPos[i].out;
        
        // For each domain character position
        for (var j = 0; j < maxDomainLength; j++) {
            // Check if this is the right position in domain array
            inLoopIsPosJ[i][j] = IsEqual();
            inLoopIsPosJ[i][j].in[0] <== domainPos[i];
            inLoopIsPosJ[i][j].in[1] <== j;
            
            // Combined condition: shouldKeep AND isPosJ
            inLoopFinalCheck[i][j] = AND();
            inLoopFinalCheck[i][j].a <== inLoopShouldKeep[i].out;
            inLoopFinalCheck[i][j].b <== inLoopIsPosJ[i][j].out;
            
            // Accumulate domain characters properly
            // Use the running sum pattern
            domainChar[j][i+1] <== domainChar[j][i] + inLoopFinalCheck[i][j].out * payload[i];
        }
    }
    
    // Extract the final domain characters
    signal domain[maxDomainLength];
    for (var i = 0; i < maxDomainLength; i++) {
        domain[i] <== domainChar[i][maxPayloadLength];
    }
    
    // ------------------------------------------------------------
    // Part 3: Hash the domain (optimized with fewer chunks)
    // ------------------------------------------------------------
    
    // Use fixed chunk size to reduce memory usage
    var chunkSize = 5; // Smaller chunks to reduce memory usage
    var numChunks = (maxDomainLength + chunkSize - 1) \ chunkSize; // Ceiling division
    
    component chunkHashers[numChunks];
    signal chunkHashes[numChunks];
    
    for (var i = 0; i < numChunks; i++) {
        chunkHashers[i] = Poseidon(chunkSize);
        
        for (var j = 0; j < chunkSize; j++) {
            if (i * chunkSize + j < maxDomainLength) {
                chunkHashers[i].inputs[j] <== domain[i * chunkSize + j];
            } else {
                chunkHashers[i].inputs[j] <== 0;
            }
        }
        
        chunkHashes[i] <== chunkHashers[i].out;
    }
    
    // Final hash combining all chunk hashes
    component finalHasher = Poseidon(numChunks);
    for (var i = 0; i < numChunks; i++) {
        finalHasher.inputs[i] <== chunkHashes[i];
    }
    
    domain_hash <== finalHasher.out;
}

// No need for the conflicting MultiAND and other helper templates
// We're using gates.circom components directly