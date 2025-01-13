import * as snarkjs from 'snarkjs'
import { generateJWTAuthenticatorInputs } from '../src/helpers/jwt-authenticator';

export async function generateProof(jwt: string) {
  try {
    // Generate circuit inputs
    const inputs = await generateJWTAuthenticatorInputs(jwt)
    
    // Generate proof using snarkjs
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      inputs,
      "/circuits/EmailJWT.wasm",  // We'll need to copy these files to public/
      "/circuits/EmailJWT.zkey"
    )
    
    // Format proof for contract
    const calldata = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals)
    
    // Parse the calldata string
    const regex = /\[(.*?)\],\[\[(.*?)\],\[(.*?)\]\],\[(.*?)\],\[(.*?)\]/
    const matches = calldata.match(regex)
    
    if (!matches) {
      throw new Error('Failed to parse proof calldata')
    }
    
    return {
      pA: matches[1].split(',').map(x => x.trim().replace(/"/g, '')),
      pB: [
        matches[2].split(',').map(x => x.trim().replace(/"/g, '')),
        matches[3].split(',').map(x => x.trim().replace(/"/g, ''))
      ],
      pC: matches[4].split(',').map(x => x.trim().replace(/"/g, '')),
      pubSignals: matches[5].split(',').map(x => x.trim().replace(/"/g, ''))
    }
  } catch (error) {
    console.error('Proof generation failed:', error)
    throw error
  }
} 