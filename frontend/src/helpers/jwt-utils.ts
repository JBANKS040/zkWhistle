import { RSAPublicKey } from './types';

/**
 * Decodes a JWT without verification
 * @param jwt The JWT string
 * @returns Decoded header and payload
 */
export function decodeJWT(jwt: string) {
  const [headerB64, payloadB64] = jwt.split('.');
  
  const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString());
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
  
  return { header, payload };
}

/**
 * Verifies a JWT using Google's public key
 * @param jwt The JWT string
 * @param publicKey RSA public key components
 * @returns Promise<boolean> indicating if JWT is valid
 */
export async function verifyJWT(jwt: string, publicKey: RSAPublicKey): Promise<boolean> {
  try {
    const [headerB64, payloadB64, signatureB64] = jwt.split('.');
    if (!headerB64 || !payloadB64 || !signatureB64) {
      throw new Error('Invalid JWT format');
    }

    // For Google OAuth JWTs, we'll use their verification endpoint
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${jwt}`);
    return response.ok;

  } catch (error) {
    console.error('JWT verification failed:', error);
    return false;
  }
}

/**
 * Extracts JWT components
 * @param jwt The JWT string
 * @returns Array of [header, payload, signature] in base64
 */
export function splitJWT(jwt: string): [string, string, string] {
  const parts = jwt.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }
  return [parts[0], parts[1], parts[2]];
} 