import axios from 'axios'
import { jwtHandler } from './jwt-utils'

export async function generateProof(jwt: string) {
  const key = {}
  try {
    // Store JWT temporarily
    jwtHandler.store(key, jwt)
    
    // First call - generate circuit inputs
    console.log('Step 1: Calling generateCircuitInputs')
    
    const inputsResponse = await axios.post('/api/generateCircuitInputs', { 
      jwt: jwtHandler.get(key)
    })
    
    if (!inputsResponse.data) {
      throw new Error('No data received from generateCircuitInputs')
    }
    
    console.log('Circuit inputs generated:', {
      messageLength: inputsResponse.data.message?.length,
      pubkeyLength: inputsResponse.data.pubkey?.length,
      signatureLength: inputsResponse.data.signature?.length
    })
    
    // Second call - generate proof
    console.log('Step 2: Calling proxyJwtProver with inputs')
    const proverResponse = await axios.post('/api/proxyJwtProver', {
      input: inputsResponse.data
    })

    if (!proverResponse.data?.proof || !proverResponse.data?.publicSignals) {
      throw new Error('Invalid proof response from proxyJwtProver')
    }

    console.log('Step 3: Proof generated successfully')

    return {
      proof: proverResponse.data.proof,
      publicSignals: proverResponse.data.publicSignals
    }
  } catch (error: any) {
    console.error('Proof generation error:', {
      message: error.message,
      status: error.response?.status
    })
    throw new Error(error.response?.data?.error || error.message)
  } finally {
    // Always cleanup
    jwtHandler.cleanup(key)
  }
}