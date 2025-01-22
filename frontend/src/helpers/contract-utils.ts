import { createPublicClient, createWalletClient, custom, http, type EIP1193Provider, BaseError, ContractFunctionRevertedError } from 'viem';
import { baseSepolia } from 'viem/chains';
import { VERIFIER_CONTRACT, REPORT_CONTRACT } from '@/config/contracts';
import { ProofData, PublicSignals } from '@/types/circuit';
import { keccak256, toHex } from 'viem'

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
  console.log('Verifying proof with:', {
    organization_hash: publicSignals.organization_hash,
    organization_name: publicSignals.organization_name,
    formatted_hash: BigInt(publicSignals.organization_hash).toString()
  });

  console.log('Starting verifyProofWithWallet with:', {
    proof: proof,
    publicSignals: publicSignals,
    organizationName: publicSignals.organization_name
  });

  const walletClient = await getWalletClient();
  if (!walletClient) throw new Error('Wallet not connected');

  const [address] = await walletClient.getAddresses();
  
  // Format proof for contract
  const formattedProof = {
    pA: proof.pi_a.slice(0, 2).map(x => BigInt(x)) as [bigint, bigint],
    pB: [
      [BigInt(proof.pi_b[0][1]), BigInt(proof.pi_b[0][0])],
      [BigInt(proof.pi_b[1][1]), BigInt(proof.pi_b[1][0])]
    ] as [[bigint, bigint], [bigint, bigint]],
    pC: proof.pi_c.slice(0, 2).map(x => BigInt(x)) as [bigint, bigint],
    pubSignals: [BigInt(publicSignals.organization_hash)] as [bigint]
  };

  console.log('Formatted proof:', formattedProof);
  console.log('Organization name being sent:', publicSignals.organization_name);
  
  const { request } = await publicClient.simulateContract({
    ...VERIFIER_CONTRACT,
    functionName: 'verifyProof',
    args: [
      formattedProof.pA,
      formattedProof.pB, 
      formattedProof.pC,
      formattedProof.pubSignals,
      publicSignals.organization_name
    ] as const,
    account: address
  });

  const hash = await walletClient.writeContract(request);
  console.log('Verification transaction hash:', hash);
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

// Function to get organization name
export async function getOrganizationName(organizationHash: bigint) {
  console.log('Getting organization name for hash:', organizationHash.toString());
  const name = await publicClient.readContract({
    ...VERIFIER_CONTRACT,
    functionName: 'getOrganizationName',
    args: [organizationHash]
  });
  console.log('Retrieved organization name:', name);
  return name;
}

// Replace the hardcoded event topic with dynamic generation
const REPORT_SUBMITTED_EVENT = keccak256(
  toHex('ReportSubmitted(uint256,uint256,uint256)')
)

export async function submitReport(title: string, content: string): Promise<bigint> {
  console.log('Starting submitReport with:', { title, content });
  
  const walletClient = await getWalletClient();
  if (!walletClient) throw new Error('Wallet not connected');

  const [address] = await walletClient.getAddresses();
  
  const orgHash = await getVerifiedOrganization(address);
  console.log('Retrieved organization hash:', orgHash.toString());
  
  await debugContractSetup();
  await checkVerifierSetup();
  
  try {
    if (orgHash === BigInt(0)) {
      throw new Error('Organization not verified');
    }

    // Simulate with more detailed parameters
    const { request } = await publicClient.simulateContract({
      address: REPORT_CONTRACT.address,
      abi: REPORT_CONTRACT.abi,
      functionName: 'submitReport',
      args: [title, content],
      account: address,
      chain: baseSepoliaChain
    });

    const hash = await walletClient.writeContract(request);
    console.log('Transaction hash:', hash);
    
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
        console.error('Contract revert reason:', revertError);
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
    const report = await publicClient.readContract({
        ...REPORT_CONTRACT,
        functionName: 'getReport',
        args: [reportId]
    });
    return report;
} 