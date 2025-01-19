import verifierABI from '../../public/JwtVerifier.json';

export const VERIFIER_ADDRESS = process.env.NEXT_PUBLIC_VERIFIER_ADDRESS as `0x${string}`;

export const VERIFIER_CONTRACT = {
  address: VERIFIER_ADDRESS,
  abi: verifierABI,
} as const;