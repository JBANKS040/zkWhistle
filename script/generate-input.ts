import { generateJWT } from '../src/helpers/jwt-generator';
import { generateJWTAuthenticatorInputs } from '../src/helpers/jwt-authenticator';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __dirname = dirname(fileURLToPath(import.meta.url));

async function generateInput() {
    // Generate a test JWT
    const kid = BigInt('0x5aaff47c21d06e266cce395b2145c7c6d4730ea5');
    const header = {
        alg: 'RS256',
        typ: 'JWT',
        kid: kid.toString(16)
    };
    
    const payload = {
        iss: "auth.example.com",
        sub: "1234567890",
        aud: "api.example.com",
        exp: Math.floor(Date.now() / 1000) + 3600,
        nbf: Math.floor(Date.now() / 1000),
        iat: Math.floor(Date.now() / 1000),
        jti: "unique-token-id",
        email: "employee@google.com"
    };

    // Generate JWT and get public key
    const { rawJWT, publicKey } = generateJWT(header, payload);

    // Generate circuit inputs
    const inputs = await generateJWTAuthenticatorInputs(rawJWT, publicKey, {
        maxMessageLength: 768 // 256 + 512 from our circuit parameters
    });

    // Write inputs to file
    writeFileSync(
        join(__dirname, '../circuits/EmailJWT_js/input.json'),
        JSON.stringify(inputs, null, 2)
    );

    console.log('Generated JWT:', rawJWT);
    console.log('Inputs written to circuits/EmailJWT_js/input.json');
}

generateInput().catch(console.error);