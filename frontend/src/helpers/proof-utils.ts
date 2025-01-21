import axios from 'axios'
import { EmailJWTCircuitInputs, CircuitProof } from '@/types/circuit';

export async function generateProof(jwt: string) {
  try {
    // First call - generate circuit inputs
    console.log('Step 1: Calling generateCircuitInputs with JWT:', jwt.slice(0, 20) + '...');
    
    const inputsResponse = await axios.post('/api/generateCircuitInputs', { 
      jwt 
    });
    
    if (!inputsResponse.data) {
      throw new Error('No data received from generateCircuitInputs');
    }
    
    console.log('Circuit inputs generated:', {
      messageLength: inputsResponse.data.message?.length,
      pubkeyLength: inputsResponse.data.pubkey?.length,
      signatureLength: inputsResponse.data.signature?.length
    });

    // Second call - generate proof
    console.log('Step 2: Calling proxyJwtProver with inputs');
    const proverResponse = await axios.post('/api/proxyJwtProver', {
      input: inputsResponse.data
    });

    if (!proverResponse.data?.proof || !proverResponse.data?.publicSignals) {
      throw new Error('Invalid proof response from proxyJwtProver');
    }

    console.log('Step 3: Proof generated successfully:', {
      proof: 'Generated',
      publicSignals: proverResponse.data.publicSignals
    });

    return proverResponse.data;
  } catch (error: any) {
    console.error('Proof generation error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw new Error(error.response?.data?.error || error.message);
  }
}

export function getOrganizationFromHash(hash: string): string {
  return 'gmail.com';
} 