import { createPublicClient, createWalletClient, custom, http, type EIP1193Provider, BaseError, ContractFunctionRevertedError } from 'viem';
import { baseSepolia } from 'viem/chains';
import { VERIFIER_CONTRACT, REPORT_CONTRACT } from '@/config/contracts';
import { ProofData, PublicSignals } from '@/types/circuit';
import { keccak256, toHex } from 'viem'
import type { HashedDomainsType } from '@/types/hashedDomains';
import HashedDomains from '@/config/HashedDomains.json';

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

// Function to verify proof - doesn't need HashedDomains
export async function verifyProofWithWallet(
  proof: ProofData, 
  publicSignals: PublicSignals
) {
  const walletClient = await getWalletClient();
  if (!walletClient) throw new Error('Wallet not connected');

  const [address] = await walletClient.getAddresses();
  
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

// Function to get verified organization hash
export async function getVerifiedOrganization(address: string) {
  return await publicClient.readContract({
    ...VERIFIER_CONTRACT,
    functionName: 'getVerifiedOrganization',
    args: [address as `0x${string}`]
  });
}

// Function to get gas price
export async function getGasPrice() {
  const gasPrice = await publicClient.getGasPrice();
  console.log('Current gas price:', gasPrice);
  return gasPrice;
}

// Add a cache for organization names
const organizationNameCache = new Map<string, string>();

export function getOrganizationName(orgHash: bigint): string {
  const hexHash = ('0x' + orgHash.toString(16).padStart(64, '0')) as `0x${string}`;
  return (HashedDomains as HashedDomainsType)[hexHash] || 'Unknown Organization';
}

// Replace the hardcoded event topic with dynamic generation
const REPORT_SUBMITTED_EVENT = keccak256(
  toHex('ReportSubmitted(uint256,uint256,uint256)')
)

// Only used during report submission
export function isTrustedOrganization(orgHash: bigint): boolean {
  const hexHash = '0x' + orgHash.toString(16).padStart(64, '0');
  return hexHash in (HashedDomains as HashedDomainsType);
}

// Submit report - this is where we check HashedDomains
export async function submitReport(title: string, content: string): Promise<bigint> {
  const walletClient = await getWalletClient();
  if (!walletClient) throw new Error('Wallet not connected');

  const [address] = await walletClient.getAddresses();
  
  const orgHash = await getVerifiedOrganization(address);
  
  try {
    if (orgHash === BigInt(0)) {
      throw new Error('Organization not verified');
    }

    const { request } = await publicClient.simulateContract({
      ...REPORT_CONTRACT,
      functionName: 'submitReport',
      args: [title, content] as const,
      account: address
    });

    const hash = await walletClient.writeContract(request);
    
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash,
      confirmations: 1
    });
    
    const reportSubmittedLog = receipt.logs.find(
      log => log.topics[0] === REPORT_SUBMITTED_EVENT
    );
    
    if (!reportSubmittedLog?.topics[1]) {
      throw new Error('Report ID not found in logs');
    }
    
    return BigInt(reportSubmittedLog.topics[1]);
  } catch (err) {
    if (err instanceof BaseError) {
      const revertError = err.walk(err => err instanceof ContractFunctionRevertedError);
      if (revertError instanceof ContractFunctionRevertedError) {
        throw new Error(`Contract reverted: ${revertError.toString() || 'Unknown reason'}`);
      }
    }
    throw err;
  }
}

// Add this function to check contract state
export async function checkContractState(address: string) {
  try {
    // Check if contract is deployed
    const code = await publicClient.getBytecode({ 
      address: REPORT_CONTRACT.address 
    });
    
    if (!code || code === '0x') {
      throw new Error('Contract not deployed at this address');
    }

    // Check report count
    const count = await publicClient.readContract({
      address: REPORT_CONTRACT.address,
      abi: REPORT_CONTRACT.abi,
      functionName: 'reportCount'
    });

    console.log('Current report count:', count);
    
    // Check verifier contract
    const verifier = await publicClient.readContract({
      address: REPORT_CONTRACT.address,
      abi: REPORT_CONTRACT.abi,
      functionName: 'verifier'
    });
    
    console.log('Verifier contract:', verifier);

    return true;
  } catch (error) {
    console.error('Contract state check failed:', error);
    throw error;
  }
}

export async function debugContractSetup() {
    console.log('Verifier address:', VERIFIER_CONTRACT.address);
    console.log('Report address:', REPORT_CONTRACT.address);
    
    // Check if contracts are deployed
    const verifierCode = await publicClient.getBytecode({ 
        address: VERIFIER_CONTRACT.address 
    });
    const reportCode = await publicClient.getBytecode({ 
        address: REPORT_CONTRACT.address 
    });
    
    console.log('Verifier deployed:', verifierCode !== '0x');
    console.log('Report deployed:', reportCode !== '0x');
    
    // Check verifier in report contract
    const reportVerifier = await publicClient.readContract({
        ...REPORT_CONTRACT,
        functionName: 'verifier'
    });
    
    console.log('Report contract verifier:', reportVerifier);
    console.log('Expected verifier:', VERIFIER_CONTRACT.address);
}

async function checkVerifierSetup() {
    // Get verifier address from WhistleblowReport contract
    const verifierAddress = await publicClient.readContract({
        ...REPORT_CONTRACT,
        functionName: 'verifier'
    });
    
    console.log('Verifier address in WhistleblowReport:', verifierAddress);
    console.log('Expected verifier address:', VERIFIER_CONTRACT.address);
    
    // Check if addresses match
    if (verifierAddress.toLowerCase() !== VERIFIER_CONTRACT.address.toLowerCase()) {
        throw new Error('Verifier address mismatch');
    }
    
    return true;
}

export async function getReport(reportId: bigint) {
  return await publicClient.readContract({
    ...REPORT_CONTRACT,
    functionName: 'getReport',
    args: [reportId]
  });
} 