import { createPublicClient, createWalletClient, custom, http, type EIP1193Provider } from 'viem';
import { baseSepolia } from 'viem/chains';
import { VERIFIER_CONTRACT } from '@/config/contracts';

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
  chain: baseSepoliaChain,
  transport: http('https://sepolia.base.org')
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
export async function verifyProofWithWallet(proof: any, publicSignals: any) {
  const walletClient = getWalletClient();
  if (!walletClient) throw new Error('Wallet not connected');

  const [address] = await walletClient.getAddresses();

  // Format proof exactly as in the working version
  const formattedProof = {
    pA: proof.pi_a.slice(0, 2).map((x: string) => BigInt(x)),
    pB: [
      [BigInt(proof.pi_b[0][1]), BigInt(proof.pi_b[0][0])],
      [BigInt(proof.pi_b[1][1]), BigInt(proof.pi_b[1][0])]
    ],
    pC: proof.pi_c.slice(0, 2).map((x: string) => BigInt(x)),
    pubSignals: [BigInt(publicSignals.organization_hash)]
  };

  console.log('Formatted proof:', {
    pA: formattedProof.pA.map((n: bigint) => n.toString()),
    pB: formattedProof.pB.map((row: bigint[]) => row.map((n: bigint) => n.toString())),
    pC: formattedProof.pC.map((n: bigint) => n.toString()),
    pubSignals: formattedProof.pubSignals.map((n: bigint) => n.toString())
  });

  try {
    const hash = await walletClient.writeContract({
      ...VERIFIER_CONTRACT,
      functionName: 'verifyProofAndStore',
      args: [
        formattedProof.pA,
        formattedProof.pB,
        formattedProof.pC,
        formattedProof.pubSignals
      ],
      account: address,
    });

    console.log('Transaction sent:', hash);
    return hash;
  } catch (error) {
    console.error('Contract call failed:', error);
    throw error;
  }
}

// Add this function to contract-utils.ts
export async function getGasPrice() {
  const gasPrice = await publicClient.getGasPrice();
  console.log('Current gas price:', gasPrice);
  return gasPrice;
} 