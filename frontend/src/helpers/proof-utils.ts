import axios from 'axios'
import { EmailJWTCircuitInputs, CircuitProof } from '@/types/circuit';

export async function generateProof(jwt: string, pubkey: any) {
  try {
    const circuitInputs = await axios.post<EmailJWTCircuitInputs>('/api/generateCircuitInputs', {
      jwt
    });
    
    console.log('Circuit inputs validation:', {
      messageLength: circuitInputs.data.message.length,
      pubkeyLength: circuitInputs.data.pubkey.length,
      signatureLength: circuitInputs.data.signature.length
    });

    const proverResponse = await axios.post<CircuitProof>('/api/proxyJwtProver', {
      input: circuitInputs.data
    }, {
      timeout: 120000, // 2 minutes
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!proverResponse.data.proof || !proverResponse.data.publicSignals) {
      throw new Error('Invalid proof response from service');
    }

    return proverResponse.data;
  } catch (error: any) {
    console.error('Proof generation error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
}

export function getOrganizationFromHash(hash: string): string {
  return 'gmail.com';
} 