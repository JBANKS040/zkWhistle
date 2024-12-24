pragma circom 2.1.9;

template ExtractDomainFromEmail(maxEmailLength, maxDomainLength) {
    signal input email[maxEmailLength];
    signal input emailDomainIndex;    // Position after @ symbol
    signal input emailDomainLength;   // Length of domain
    
    signal output domainName[maxDomainLength];
    
    // Declare all signals at the root scope
    signal selectors[maxDomainLength][maxEmailLength];
    signal isPosition[maxDomainLength][maxEmailLength];
    signal sum[maxDomainLength][maxEmailLength];
    signal isWithinLength[maxDomainLength];
    
    // Validate inputs
    assert(emailDomainLength <= maxDomainLength);
    assert(emailDomainIndex + emailDomainLength <= maxEmailLength);
    
    // For each possible position in the domain
    for (var i = 0; i < maxDomainLength; i++) {
        // For each email character, check if it should be selected
        for (var j = 0; j < maxEmailLength; j++) {
            // Set binary signal that's 1 if this is the right position
            isPosition[i][j] <-- j == emailDomainIndex + i ? 1 : 0;
            // Constrain isPosition to be binary
            isPosition[i][j] * (1 - isPosition[i][j]) === 0;
            
            // Multiply email character by selector
            selectors[i][j] <== email[j] * isPosition[i][j];
        }
        
        // Sum up all selected characters (only one will be non-zero)
        sum[i][0] <== selectors[i][0];
        for (var j = 1; j < maxEmailLength; j++) {
            sum[i][j] <== sum[i][j-1] + selectors[i][j];
        }
        
        // Handle zero padding based on domain length
        isWithinLength[i] <-- i < emailDomainLength ? 1 : 0;
        isWithinLength[i] * (1 - isWithinLength[i]) === 0;
        
        domainName[i] <== sum[i][maxEmailLength-1] * isWithinLength[i];
    }
}