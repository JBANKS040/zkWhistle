pragma circom 2.1.9;

include "../jwt.circom";

template JWTTest() {
    // Test vector for a known JWT
    component main = JWTVerifier(
        256,  // max_header_bytes
        512,  // max_payload_bytes
        256,  // n_bytes (modulus size)
        256,  // signature_bytes
        64    // max_exp_length
    );
    
    // Test inputs
    signal input test_jwt_hash[256];
    signal input test_header[256];
    signal input test_payload[512];
    signal input test_signature[256];
    signal input test_modulus[256];
    signal input test_exponent;

    // Connect test inputs
    main.jwt_hash <== test_jwt_hash;
    main.header <== test_header;
    main.payload <== test_payload;
    main.signature <== test_signature;
    main.modulus <== test_modulus;
    main.exponent <== test_exponent;

    // Assert expected outputs
    // Note: These values should be replaced with actual expected values
    signal expected_org_hash;
    signal expected_exp;
    
    expected_org_hash === main.organization_hash;
    expected_exp === main.exp_timestamp;
}

component main = JWTTest();
