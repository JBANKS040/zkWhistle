import { generateJWTVerifierInputs } from '../lib/jwt-tx-builder/packages/helpers/src/input-generators';
import { generateJWT } from '../lib/jwt-tx-builder/packages/helpers/src/jwt';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function generateInput() {
    const kid = BigInt('0x5aaff47c21d06e266cce395b2145c7c6d4730ea5');
    const header = {
        alg: 'RS256',
        typ: 'JWT',
        kid: kid.toString(16)
    };
    
    const payload = {
        org: "testorg",
        exp: Math.floor(Date.now() / 1000) + 3600,
        iss: "test-issuer",
        iat: Math.floor(Date.now() / 1000),
        azp: "test-authorized-party",
        email: "test@example.com",
        nonce: "Send 0.12 ETH to 0x1234"
    };

    const { rawJWT, publicKey } = generateJWT(header, payload);
    const inputs = await generateJWTVerifierInputs(rawJWT, publicKey, {
        maxMessageLength: 768
    });

    writeFileSync(
        join(__dirname, '../circuits/jwt_js/input.json'),
        JSON.stringify(inputs, null, 2)
    );
}

generateInput().catch(console.error);