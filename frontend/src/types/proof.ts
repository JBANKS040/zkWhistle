export interface CircuitInput {
  message: number[]
  messageLength: number
  pubkey: number[]
  signature: number[]
  periodIndex: number
  emailDomainIndex: number
  emailDomainLength: number
}

export interface FormattedProof {
  pA: [`0x${string}`, `0x${string}`]
  pB: [
    [`0x${string}`, `0x${string}`],
    [`0x${string}`, `0x${string}`]
  ]
  pC: [`0x${string}`, `0x${string}`]
  publicSignals: `0x${string}`[]
}

export interface Proof {
  proof: {
    pi_a: string[]
    pi_b: string[][]
    pi_c: string[]
  }
  publicSignals: string[]
} 