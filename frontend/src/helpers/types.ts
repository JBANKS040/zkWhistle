export interface RSAPublicKey {
  n: string;
  e: number;
}

export interface EmailJWTCircuitInputs {
  // Base inputs from zkemail
  message: bigint[];
  messageLength: number;
  pubkey: bigint[];
  signature: bigint[];
  periodIndex: number;
  
  // Your circuit's additional inputs
  jwt_exp: string;
  proof_exp: string;
  current_time: string;
  emailDomainIndex: string;
  emailDomainLength: string;
}
