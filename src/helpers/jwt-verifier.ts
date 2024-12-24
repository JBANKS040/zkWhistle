import NodeRSA from 'node-rsa';
import { RSAPublicKey } from './types';
import { splitJWT } from './utils';

export async function verifyJWT(token: string, pubkey: RSAPublicKey): Promise<boolean> {
    if (!token) {
        throw new Error('Invalid JWT: JWT token must be provided.');
    }

    const [headerString, payloadString, signatureString] = splitJWT(token);

    const key = new NodeRSA();
    key.importKey(
        {
            n: Buffer.from(pubkey.n, 'base64'),
            e: pubkey.e,
        },
        'components-public'
    );

    const dataToVerify = `${headerString}.${payloadString}`;

    try {
        const isValidSignature = key.verify(
            Buffer.from(dataToVerify),
            signatureString,
            'utf8',
            'base64'
        );

        return isValidSignature;
    } catch (error) {
        console.error('JWT verification error:', error);
        return false;
    }
} 