import { Uint8ArrayToCharArray, toCircomBigIntBytes, sha256Pad } from '@zk-email/helpers';
import { RSAPublicKey, JWTAuthenticatorInputs } from './types';
import { verifyJWT } from './jwt-verifier';
import { base64ToBigInt, splitJWT } from './utils';

const MAX_JWT_PADDED_BYTES = 768; // 256 + 512 from circuit parameters

function getDomainFromEmail(email: string): { domain: string; index: number } {
  const match = email.match(/@(.+)$/);
  if (!match) {
    throw new Error(`Invalid email format: ${email}`);
  }
  return {
    domain: match[1],
    index: match.index! + 1,
  };
}

export async function generateJWTAuthenticatorInputs(
  rawJWT: string,
  publicKey: RSAPublicKey,
  params: { maxMessageLength?: number } = {}
): Promise<JWTAuthenticatorInputs> {
  // Validate inputs
  if (!rawJWT || typeof rawJWT !== 'string') {
    throw new Error('Invalid JWT: Must be a non-empty string');
  }

  // Split and decode JWT
  const [headerString, payloadString, signatureString] = splitJWT(rawJWT);
  const payload = JSON.parse(Buffer.from(payloadString, 'base64').toString());

  // Verify JWT
  const isVerified = await verifyJWT(rawJWT, publicKey);
  if (!isVerified) {
    throw new Error('JWT verification failed');
  }

  // Prepare message
  const message = Buffer.from(`${headerString}.${payloadString}`);
  const [messagePadded, messagePaddedLen] = sha256Pad(
    message,
    params.maxMessageLength || MAX_JWT_PADDED_BYTES
  );

  // Get domain info from email
  const { domain, index: emailDomainIndex } = getDomainFromEmail(payload.email);

  return {
    message: Uint8ArrayToCharArray(messagePadded),
    messageLength: messagePaddedLen.toString(),
    pubkey: toCircomBigIntBytes(base64ToBigInt(publicKey.n)),
    signature: toCircomBigIntBytes(base64ToBigInt(signatureString)),
    periodIndex: rawJWT.indexOf('.').toString(),
    emailDomainIndex: emailDomainIndex.toString(),
    emailDomainLength: domain.length
  };
}