import { base64ToBigInt } from './utils';

interface EmailDomainInfo {
  domainIndex: number;
  domainLength: number;
}

/**
 * Extracts domain information from an email address in a JWT payload
 * @param email The complete email string
 * @returns Domain information including index and length
 */
export function extractEmailDomain(email: string): EmailDomainInfo {
  try {
    const atIndex = email.indexOf('@');
    if (atIndex === -1) {
      throw new Error('Invalid email format');
    }

    const domain = email.slice(atIndex + 1);
    
    return {
      domainIndex: atIndex + 1,
      domainLength: domain.length
    };
  } catch (error) {
    console.error('Email parsing error:', error);
    throw error;
  }
}

/**
 * Converts email domain to circuit-compatible format
 * @param domain The email domain string
 * @returns Poseidon-compatible hash input
 */
export function formatDomainForCircuit(domain: string): bigint {
  const domainBuffer = Buffer.from(domain.toLowerCase());
  return base64ToBigInt(domainBuffer.toString('base64'));
} 