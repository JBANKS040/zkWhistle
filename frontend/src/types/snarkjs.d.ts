declare module 'snarkjs' {
  export interface Groth16Proof {
    pi_a: string[]
    pi_b: string[][]
    pi_c: string[]
    protocol: string
    curve: string
  }

  export const groth16: {
    fullProve: (input: any, wasmFile: string, zkeyFile: string) => Promise<{
      proof: Groth16Proof
      publicSignals: string[]
    }>
    verify: (vKey: any, publicSignals: string[], proof: Groth16Proof) => Promise<boolean>
  }
} 