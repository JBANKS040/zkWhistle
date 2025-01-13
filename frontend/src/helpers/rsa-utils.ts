import { RSAPublicKey } from './types';

export async function getGooglePublicKey(kid: string): Promise<RSAPublicKey> {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/certs');
  const keys = await response.json();
  
  const key = keys.keys.find((k: any) => k.kid === kid);
  if (!key) {
    throw new Error('Public key not found');
  }

  return {
    n: key.n,
    e: 65537 // Google always uses e=65537 (0x10001)
  };
} 