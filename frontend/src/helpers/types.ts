export interface RSAPublicKey {
  n: string;
  e: number;
}

export interface EmailJWTCircuitInputs {
  message: bigint[];
  messageLength: number;
  pubkey: bigint[];
  signature: bigint[];
  periodIndex: number;
  emailDomainIndex: number;
  emailDomainLength: number;
  jwt?: string;
}

export interface CircuitProof {
  proof: {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
    protocol: "groth16";
  };
  publicSignals: {
    organization_hash: string;
  };
}
