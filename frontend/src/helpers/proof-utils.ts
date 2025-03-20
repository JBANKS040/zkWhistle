import axios from 'axios'
import { jwtHandler } from './jwt-utils'
import { keccak256, toHex } from 'viem'
import { CIRCUIT_ARTIFACTS } from '@/config/circuits'
import * as snarkjs from 'snarkjs'

// Helper function to generate report hash consistently with the contract
export function generateReportHash(title: string, content: string): string {
  // Use the same hashing algorithm that the contract uses (keccak256)
  // Important: The contract uses abi.encodePacked(_title, "|", _content) which is equivalent to
  // a raw byte concatenation of the UTF-8 encoded strings, not a simple string concatenation
  const contentForHashing = title + "|" + content;
  
  // Add debugging for hash generation
  console.log('HASH DEBUG - Generating hash for:', {
    title: title,
    content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
    contentForHashing: contentForHashing.substring(0, 50) + (contentForHashing.length > 50 ? '...' : '')
  });
  
  // We need to encode exactly as Solidity does with abi.encodePacked
  // For strings, this is the UTF-8 bytes
  const hash = keccak256(toHex(contentForHashing));
  const hashAsBigInt = BigInt(hash).toString();
  
  console.log('HASH DEBUG - Generated hash:', {
    hex: hash,
    decimal: hashAsBigInt
  });
  
  return hash;
}

// Update the generateCircuitInputs function - Remove since we don't need it anymore
// Circuit extracts domain directly from payload

export async function generateProof(jwt: string, reportTitle: string = "", reportContent: string = "") {
  const key = {}
  try {
    // Store JWT temporarily
    jwtHandler.store(key, jwt)
    
    // Calculate report hash if title and content provided
    let reportHash = "0";
    if (reportTitle && reportContent) {
      reportHash = generateReportHash(reportTitle, reportContent);
      console.log('Generated report hash:', reportHash);
    }
    
    // First call - generate circuit inputs
    console.log('Step 1: Calling generateCircuitInputs');
    const inputsResponse = await axios.post('/api/generateCircuitInputs', { 
      jwt: jwtHandler.get(key),
      reportTitle,
      reportContent
    })
    
    if (!inputsResponse.data) {
      throw new Error('No data received from generateCircuitInputs')
    }
    
    console.log('Circuit inputs generated:', {
      messageLength: inputsResponse.data.message?.length,
      pubkeyLength: inputsResponse.data.pubkey?.length,
      signatureLength: inputsResponse.data.signature?.length,
      emailKeyIndex: inputsResponse.data.emailKeyIndex,
      hasReportContent: !!inputsResponse.data.reportContentHash
    })
    
    // Generate proof using IPFS circuit files
    console.log('Step 2: Generating proof with snarkjs');
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      inputsResponse.data,
      CIRCUIT_ARTIFACTS.WASM_URL,
      CIRCUIT_ARTIFACTS.ZKEY_URL
    );

    console.log('Step 3: Proof generated successfully');
    
    // Create the formatted public signals
    const formattedPublicSignals = {
      organization_hash: publicSignals[0] || "0",
      report_hash: publicSignals[1] || reportHash || "0"
    };
    
    console.log('Formatted public signals:', formattedPublicSignals);

    // Verify both values are non-zero
    if (formattedPublicSignals.organization_hash === "0") {
      console.warn('Warning: organization_hash is 0, this might cause issues');
    }
    
    if (formattedPublicSignals.report_hash === "0") {
      console.warn('Warning: report_hash is 0, this might cause issues');
    }

    return { proof, publicSignals: formattedPublicSignals };
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

async function fetchWithFallback(mainUrl: string, fallbackUrls: string[]): Promise<ArrayBuffer> {
  const urls = [mainUrl, ...fallbackUrls];
  
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.arrayBuffer();
      }
    } catch (error) {
      console.warn(`Failed to fetch from ${url}:`, error);
    }
  }
  throw new Error('Failed to fetch circuit artifact from all sources');
}

export async function generateProofForReport(jwt: string, title: string, content: string) {
  try {
    // Generate circuit inputs
    const inputsResponse = await axios.post('/api/generateCircuitInputs', { 
      jwt,
      reportTitle: title,
      reportContent: content
    });
    
    const inputs = inputsResponse.data;

    // Use IPFS URLs directly instead of fetching ArrayBuffers
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      inputs,
      CIRCUIT_ARTIFACTS.WASM_URL,
      CIRCUIT_ARTIFACTS.ZKEY_URL
    );

    return { proof, publicSignals };
  } catch (error) {
    console.error('Error generating proof:', error);
    throw error;
  }
}