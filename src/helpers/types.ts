export interface RSAPublicKey {
  n: string;
  e: number;
}

export interface JWTComponents {
  rawJWT: string;
  publicKey: RSAPublicKey;
}

export interface JWTAuthenticatorInputs {
  message: string[];
  messageLength: string;
  pubkey: string[];
  signature: string[];
  periodIndex: string;
  emailDomainIndex: string;
  emailDomainLength: number;
}
