export interface EmailJWTCircuitInputs {
  message: bigint[];        // Will be padded to 2048
  messageLength: number;
  pubkey: bigint[];        // Will be padded to 17
  signature: bigint[];     // Will be padded to 17
  jwt: string;            // Original JWT for verification
  periodIndex: number;
  emailDomainIndex: number;
  emailDomainLength: number;
  jwt_exp: number;
  proof_exp: number;
  current_time: number;
}

// Add helper types for proof output
export interface ProofData {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: string;
  curve: string;
}

export type PublicSignals = {
  organization_hash: string;
  organization_name: string;
}

export interface CircuitProof {
  proof: {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
    protocol: string;
  };
  publicSignals: {
    organization_hash: string;
    proof_expiry: string;
  };
} 