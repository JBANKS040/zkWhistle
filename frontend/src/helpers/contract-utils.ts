import { createPublicClient, createWalletClient, custom, http, type EIP1193Provider } from 'viem';
import { baseSepolia } from 'viem/chains';
import { VERIFIER_CONTRACT } from '@/config/contracts';
import { ProofData, PublicSignals } from '@/types/circuit';

export { VERIFIER_CONTRACT };

// Define Base Sepolia chain configuration
export const baseSepoliaChain = {
  ...baseSepolia,
  rpcUrls: {
    default: { http: ['https://sepolia.base.org'] },
    public: { http: ['https://sepolia.base.org'] },
  },
}

// Public client for reading from the blockchain
export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http()
});

// Function to get wallet client
export const getWalletClient = () => {
  if (typeof window === 'undefined') return null;
  
  const ethereum = window.ethereum as EIP1193Provider | undefined;
  if (!ethereum) return null;
  
  return createWalletClient({
    chain: baseSepoliaChain,
    transport: custom(ethereum)
  });
};

// Function to verify proof using connected wallet
export async function verifyProofWithWallet(
  proof: ProofData, 
  publicSignals: PublicSignals
) {
  const walletClient = await getWalletClient();
  if (!walletClient) throw new Error('Wallet not connected');

  const [address] = await walletClient.getAddresses();
  
  // Format proof for contract - ensure arrays are exactly the right length
  const formattedProof = {
    pA: proof.pi_a.slice(0, 2).map(x => BigInt(x)) as [bigint, bigint],
    pB: [
      [BigInt(proof.pi_b[0][1]), BigInt(proof.pi_b[0][0])],
      [BigInt(proof.pi_b[1][1]), BigInt(proof.pi_b[1][0])]
    ] as [[bigint, bigint], [bigint, bigint]],
    pC: proof.pi_c.slice(0, 2).map(x => BigInt(x)) as [bigint, bigint],
    pubSignals: [BigInt(publicSignals.organization_hash)] as [bigint]
  };

  const { request } = await publicClient.simulateContract({
    ...VERIFIER_CONTRACT,
    functionName: 'verifyProof',
    args: [
      formattedProof.pA,
      formattedProof.pB, 
      formattedProof.pC,
      formattedProof.pubSignals
    ] as const,
    account: address
  });

  const hash = await walletClient.writeContract(request);
  return hash;
}

// Function to get verified organization for an address
export async function getVerifiedOrganization(address: string) {
  const data = await publicClient.readContract({
    ...VERIFIER_CONTRACT,
    functionName: 'getVerifiedOrganization',
    args: [address as `0x${string}`]
  });
  return data;
}

// Function to get gas price
export async function getGasPrice() {
  const gasPrice = await publicClient.getGasPrice();
  console.log('Current gas price:', gasPrice);
  return gasPrice;
} 