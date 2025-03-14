import { RSAPublicKey } from './types';
import { MAX_MESSAGE_LENGTH, RSA_N_BITS, RSA_K_CHUNKS } from './constants';
import { extractEmailDomain } from './email-utils';
import { sha256Pad } from '@zk-email/helpers';
import { keccak256, toHex } from 'viem';

function rsaToCircomFormat(base64Str: string, numChunks: number): bigint[] {
  // Convert base64 to BigInt
  const buffer = Buffer.from(base64Str, 'base64url');
  const num = BigInt('0x' + buffer.toString('hex'));
  
  // Split into chunks of RSA_N_BITS
  const chunks: bigint[] = [];
  let remaining = num;
  const mask = (BigInt(1) << BigInt(RSA_N_BITS)) - BigInt(1);
  
  for (let i = 0; i < numChunks; i++) {
    chunks.push(remaining & mask);
    remaining = remaining >> BigInt(RSA_N_BITS);
  }
  
  return chunks;
}

export async function generateEmailJWTInputs(
  jwt: string, 
  publicKey: RSAPublicKey,
  reportTitle: string = "",
  reportContent: string = ""
) {
  // Split and decode JWT
  const [headerB64, payloadB64, signatureB64] = jwt.split('.');
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());

  if (!payload.email) {
    throw new Error('No email found in JWT payload');
  }

  // Extract email domain info
  const { domainIndex, domainLength } = extractEmailDomain(payload.email);

  // Prepare message for circuit
  const message = Buffer.from(`${headerB64}.${payloadB64}`);
  const [messagePadded, messagePaddedLen] = sha256Pad(message, MAX_MESSAGE_LENGTH);

  // Convert signature to bigint array
  const signature = Buffer.from(signatureB64, 'base64');
  const signatureBigInts = rsaToCircomFormat(signatureB64, RSA_K_CHUNKS);

  // Convert public key to bigint array
  const pubkeyBuffer = Buffer.from(publicKey.n, 'base64');
  const pubkeyBigInts = rsaToCircomFormat(publicKey.n, RSA_K_CHUNKS);

  // Calculate report content hash
  let reportContentHash = BigInt(0);
  if (reportTitle && reportContent) {
    // Use keccak256 to hash the report content
    const contentForHashing = reportTitle + "|" + reportContent;
    console.log('Hashing report content:', {
      title: reportTitle.slice(0, 10) + '...',
      contentLength: reportContent.length,
      contentForHashing: contentForHashing.slice(0, 20) + '...'
    });
    
    const hash = keccak256(toHex(contentForHashing));
    console.log('Generated report hash:', hash);
    reportContentHash = BigInt(hash);
    console.log('Report content hash as BigInt:', reportContentHash.toString());
  } else {
    console.log('No report title or content provided, using 0 for reportContentHash');
  }

  return {
    message: Array.from(messagePadded).map(b => BigInt(b)),
    messageLength: messagePaddedLen,
    pubkey: pubkeyBigInts,
    signature: signatureBigInts,
    periodIndex: jwt.indexOf('.'),
    emailDomainIndex: Number(domainIndex),
    emailDomainLength: Number(domainLength),
    reportContentHash,
    jwt // Include original JWT for verification
  };
} 