import { writeFileSync } from 'fs';
import { join } from 'path';
import * as crypto from 'crypto';

// Helper function for SHA256 padding
function sha256Pad(buffer: Buffer): Buffer {
    const length = buffer.length;
    const bitLength = length * 8;
    
    // Calculate padding length (ensure it's positive)
    let k = (448 - (bitLength + 1)) % 512;
    if (k < 0) k += 512; // Make k positive
    const paddingLength = Math.ceil((k + 1) / 8);
    
    // Create padding buffer
    const padding = Buffer.alloc(paddingLength + 8); // +8 for length
    padding[0] = 0x80;
    
    // Add length in bits as big-endian 64-bit number
    const view = new DataView(padding.buffer, padding.byteOffset + padding.length - 8);
    view.setBigUint64(0, BigInt(bitLength), false); // false for big-endian
    
    // Concatenate original buffer and padding
    return Buffer.concat([buffer, padding]);
}

async function generateInput() {
    // Generate RSA key pair
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        publicExponent: 65537
    });

    // Function to pad base64url to multiple of 4 while keeping JWT format
    function base64urlPad(obj: any): string {
        const base64 = Buffer.from(JSON.stringify(obj))
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
        
        // Add padding to make length multiple of 4
        const padding = 4 - (base64.length % 4);
        if (padding < 4) {
            return base64 + '='.repeat(padding);
        }
        return base64;
    }

    const header = {
        alg: "RS256",
        typ: "JWT",
        kid: "test-key-id"
    };
    
    const payload = {
        org: "testorg",
        exp: Math.floor(Date.now() / 1000) + 3600,
        iss: "test-issuer",
        iat: Math.floor(Date.now() / 1000),
        azp: "test-authorized-party",
        email: "test@example.com",
        nonce: "test-command"
    };

    const headerB64 = base64urlPad(header);
    const payloadB64 = base64urlPad(payload);
    const message = `${headerB64}.${payloadB64}`;
    const messageBuffer = Buffer.from(message);

    // Create message array with zeros
    const messageArray = new Array(768).fill(0);

    // Copy only the original message bytes
    for (let i = 0; i < messageBuffer.length; i++) {
        messageArray[i] = messageBuffer[i];
    }

    // Debug verification
    console.log('\nMessage details:');
    console.log('- Original length:', messageBuffer.length);
    console.log('- Header part:', headerB64);
    console.log('- Payload part:', payloadB64);
    console.log('- Period index:', message.indexOf('.'));
    console.log('- First byte after message:', messageArray[messageBuffer.length]);

    // Sign the message
    const signature = crypto.sign(
        'sha256',
        messageBuffer,
        {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_PADDING,
        }
    );

    // Extract RSA modulus
    const pubKeyDer = crypto.createPublicKey(publicKey).export({ format: 'der', type: 'spki' });
    const modulusStart = pubKeyDer.indexOf(Buffer.from([0x02, 0x81])) + 2;
    const modulusLength = pubKeyDer[modulusStart - 1];
    const modulus = pubKeyDer.slice(modulusStart, modulusStart + modulusLength);

    // Split into chunks
    const pubkeyChunks = new Array(17).fill(0);
    const sigChunks = new Array(17).fill(0);
    
    let remainingPubKey = BigInt('0x' + modulus.toString('hex'));
    let remainingSig = BigInt('0x' + signature.toString('hex'));
    
    const CHUNK_SIZE = BigInt(2) ** BigInt(121);
    const CHUNK_MASK = CHUNK_SIZE - BigInt(1);
    
    for(let i = 0; i < 17; i++) {
        pubkeyChunks[i] = remainingPubKey & CHUNK_MASK;
        sigChunks[i] = remainingSig & CHUNK_MASK;
        remainingPubKey = remainingPubKey >> BigInt(121);
        remainingSig = remainingSig >> BigInt(121);
    }

    // Convert BigInt values to strings in the input object
    const input = {
        message: messageArray,
        messageLength: messageBuffer.length,
        pubkey: pubkeyChunks.map(n => n.toString()),
        signature: sigChunks.map(n => n.toString()),
        periodIndex: message.indexOf('.')
    };

    // Add debug info to verify padding
    console.log('\nPadding verification:');
    console.log('- Message length:', messageBuffer.length);
    console.log('- Array length:', messageArray.length);
    console.log('- First non-zero after message:', messageArray.slice(messageBuffer.length).findIndex(x => x !== 0));
    console.log('- Last 32 bytes:', messageArray.slice(messageArray.length - 32).join(','));

    // Debug logs
    console.log('Message details:');
    console.log('- Original message length:', messageBuffer.length);
    console.log('- Padded message length:', messageArray.length);
    console.log('- Is padded length multiple of 64?', messageArray.length % 64 === 0);
    console.log('- Header Base64 length:', headerB64.length);
    console.log('- Payload Base64 length:', payloadB64.length);
    console.log('- Header Base64 multiple of 4?', headerB64.length % 4 === 0);
    console.log('- Payload Base64 multiple of 4?', payloadB64.length % 4 === 0);

    console.log('\nInput validation:');
    console.log('- Message array length:', input.message.length);
    console.log('- Message length:', input.messageLength);
    console.log('- Pubkey chunks:', input.pubkey.length);
    console.log('- Signature chunks:', input.signature.length);
    console.log('- Period index:', input.periodIndex);

    console.log('\nMessage content:');
    console.log('- First 32 bytes:', messageArray.slice(0, 32));
    console.log('- Last 32 bytes:', messageArray.slice(messageArray.length - 32, messageArray.length));
    console.log('- Padding start:', messageArray.slice(messageBuffer.length, messageBuffer.length + 16));

    // Save files in circuits/jwt_js directory
    const circuitDir = join(__dirname, '../circuits/jwt_js');
    
    // Create directory if it doesn't exist
    const fs = require('fs');
    if (!fs.existsSync(circuitDir)){
        fs.mkdirSync(circuitDir, { recursive: true });
    }

    // Save input file with pretty printing for debugging
    writeFileSync(
        join(circuitDir, 'input.json'),
        JSON.stringify(input, null, 2)
    );

    // Save JWT for reference
    const fullJwt = `${message}.${signature.toString('base64url')}`;
    writeFileSync(
        join(circuitDir, 'test.jwt'),
        fullJwt
    );

    console.log('\nFiles generated:');
    console.log('- input.json and test.jwt in circuits/jwt_js/');
    console.log('- JWT:', fullJwt);
    
    // Verify JWT
    const verified = crypto.verify(
        'sha256',
        messageBuffer,
        {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_PADDING,
        },
        signature
    );
    console.log('- JWT verification:', verified);
}

generateInput().catch(console.error);