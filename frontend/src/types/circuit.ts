export interface EmailJWTCircuitInputs {
  message: bigint[];        // Will be padded to 2048
  messageLength: number;
  pubkey: bigint[];        // Will be padded to 17
  signature: bigint[];     // Will be padded to 17
  periodIndex: number;
  emailDomainIndex: number;
  emailDomainLength: number;
  reportContentHash: bigint;
  jwt?: string;            // Optional original JWT for verification
}

// Add helper types for proof output
export interface ProofData {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: "groth16";
}

export interface PublicSignals {
  organization_hash: string;
  report_hash: string;
}

export interface CircuitProof {
  proof: ProofData;
  publicSignals: PublicSignals;
}

// If this file doesn't exist, create it at this path
export interface RSAPublicKey {
  n: string;
  e: number;
}

// These interfaces are for working with API responses
export interface GenerateCircuitInputsResponse {
  message: string[];
  messageLength: number;
  pubkey: string[];
  signature: string[];
  periodIndex: number;
  emailDomainIndex: number; 
  emailDomainLength: number;
  reportContentHash: string;
}

export interface ProverResponse {
  proof: ProofData;
  publicSignals: PublicSignals;
} 