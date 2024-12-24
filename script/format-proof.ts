import * as snarkjs from "snarkjs"
import { readFileSync } from 'fs'

async function formatProof() {
    try {
        const proof = JSON.parse(readFileSync('./circuits/EmailJWT_js/proof.json', 'utf-8'))
        const publicSignals = JSON.parse(readFileSync('./circuits/EmailJWT_js/public.json', 'utf-8'))
        
        // Format the proof for Solidity verifier
        const calldata = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals)
        
        // Parse using regex to handle nested structure
        const regex = /\[(.*?)\],\[\[(.*?)\],\[(.*?)\]\],\[(.*?)\],\[(.*?)\]/
        const matches = calldata.match(regex)
        
        if (!matches) {
            throw new Error('Failed to parse calldata structure')
        }
        
        // Extract components
        const pA = matches[1].split(',').map(x => x.trim().replace(/"/g, ''))
        const pB = [
            matches[2].split(',').map(x => x.trim().replace(/"/g, '')),
            matches[3].split(',').map(x => x.trim().replace(/"/g, ''))
        ]
        const pC = matches[4].split(',').map(x => x.trim().replace(/"/g, ''))
        const pubSignals = matches[5].split(',').map(x => x.trim().replace(/"/g, ''))
        
        // Format for test file
        console.log('\nTest values to replace in Whistleblower.t.sol:')
        console.log(`uint[2] samplePA = [${pA[0]}, ${pA[1]}];`)
        console.log(`uint[2][2] samplePB = [[${pB[0][0]}, ${pB[0][1]}], [${pB[1][0]}, ${pB[1][1]}]];`)
        console.log(`uint[2] samplePC = [${pC[0]}, ${pC[1]}];`)
        console.log(`uint[2] samplePubSignals = [${pubSignals[0]}, ${pubSignals[1]}];`)
        
        // Also log raw values for verification
        console.log('\nParsed values:')
        console.log('pA:', pA)
        console.log('pB:', pB)
        console.log('pC:', pC)
        console.log('pubSignals:', pubSignals)
        
    } catch (error: any) {
        console.error('Error:', error)
        if (error?.stack) {
            console.error('Stack:', error.stack)
        }
    }
}

formatProof().catch((error: any) => {
    console.error('Unhandled error:', error)
}) 