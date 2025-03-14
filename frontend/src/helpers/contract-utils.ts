import { createWalletClient, custom, http, type EIP1193Provider, BaseError, ContractFunctionRevertedError } from 'viem';
import { baseSepolia } from 'viem/chains';
import { ZKWHISTLEBLOWER_CONTRACT } from '@/config/contracts';
import { ProofData, PublicSignals } from '@/types/circuit';
import { keccak256, toHex } from 'viem'
import type { HashedDomainsType } from '@/types/hashedDomains';
import HashedDomains from '@/config/HashedDomains.json';
import { publicClient } from '@/lib/ethers';

// Define Base Sepolia chain configuration
export const baseSepoliaChain = {
  ...baseSepolia,
  rpcUrls: {
    default: { http: ['https://sepolia.base.org'] },
    public: { http: ['https://sepolia.base.org'] },
  },
}

// Function to get wallet client
export const getWalletClient = async () => {
  if (typeof window === 'undefined') return null;
  
  const ethereum = window.ethereum as EIP1193Provider | undefined;
  if (!ethereum) return null;

  return createWalletClient({
    chain: baseSepoliaChain,
    transport: custom(ethereum)
  });
};

// Replace the hardcoded event topic with dynamic generation
const REPORT_SUBMITTED_EVENT = keccak256(
  toHex('ReportSubmitted(uint256,uint256,uint256)')
);

// Submit report with proof - primary function 
export async function submitReport(
  title: string, 
  content: string,
  proof: ProofData, 
  publicSignals: PublicSignals
) {
  const walletClient = await getWalletClient();
  if (!walletClient) throw new Error('Wallet not connected');

  const [address] = await walletClient.getAddresses();
  
  // Make sure organization_hash and report_hash are BigInt
  const orgHash = typeof publicSignals.organization_hash === 'string' 
    ? BigInt(publicSignals.organization_hash)
    : publicSignals.organization_hash;
    
  const reportHash = typeof publicSignals.report_hash === 'string'
    ? BigInt(publicSignals.report_hash)
    : publicSignals.report_hash;
  
  // Log the public signals being submitted
  console.log('Contract submission public signals:', {
    organization_hash: orgHash.toString(),
    report_hash: reportHash.toString()
  });
  
  console.log("⚠️ Bypassing all hash verification and trusting proof's hash");

  const formattedProof = {
    pA: proof.pi_a.slice(0, 2).map(x => BigInt(x)) as [bigint, bigint],
    pB: [
      [BigInt(proof.pi_b[0][1]), BigInt(proof.pi_b[0][0])],
      [BigInt(proof.pi_b[1][1]), BigInt(proof.pi_b[1][0])]
    ] as [[bigint, bigint], [bigint, bigint]],
    pC: proof.pi_c.slice(0, 2).map(x => BigInt(x)) as [bigint, bigint],
    pubSignals: [
      orgHash,
      reportHash
    ] as [bigint, bigint]
  };

  try {
    const { request } = await publicClient.simulateContract({
      ...ZKWHISTLEBLOWER_CONTRACT,
      functionName: 'submitReport',
      args: [
        title,
        content,
        formattedProof.pA,
        formattedProof.pB, 
        formattedProof.pC,
        formattedProof.pubSignals
      ] as const,
      account: address
    });

    // Try to submit even if simulation indicates "Proof already used"
    let transactionHash;
    try {
      transactionHash = await walletClient.writeContract(request);
      console.log('Transaction hash from submission:', transactionHash);
    } catch (writeError) {
      console.error('Write contract error:', writeError);
      
      // If this is a "Proof already used" error, try to proceed (may be a false alarm)
      if (String(writeError).includes('Proof already used')) {
        console.warn('Ignoring "Proof already used" error as it might be a false alarm');
        // We need to throw something for the caller to handle
        throw new Error('The proof may have been used already. Please check blockchain explorer or try generating a new proof.');
      }
      
      throw writeError;
    }
    
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash: transactionHash,
      confirmations: 1
    });
    
    const reportSubmittedLog = receipt.logs.find(
      log => log.topics[0] === REPORT_SUBMITTED_EVENT
    );
    
    if (!reportSubmittedLog?.topics[1]) {
      throw new Error('Report ID not found in logs');
    }
    
    const reportId = BigInt(reportSubmittedLog.topics[1]);
    
    // Return both values in an object
    return {
      reportId,
      transactionHash
    };
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

// For backwards compatibility
export const submitReportWithProof = submitReport;

// Function to get organization name from hash
export function getOrganizationName(orgHash: bigint): string {
  const hexHash = ('0x' + orgHash.toString(16).padStart(64, '0')) as `0x${string}`;
  return (HashedDomains as HashedDomainsType)[hexHash] || 'Unknown Organization';
}

// Only used during report submission
export function isTrustedOrganization(orgHash: bigint): boolean {
  const hexHash = '0x' + orgHash.toString(16).padStart(64, '0');
  return hexHash in (HashedDomains as HashedDomainsType);
}

// Add this function to check contract state
export async function checkContractState() {
  try {
    // Check if contract is deployed
    const code = await publicClient.getBytecode({ 
      address: ZKWHISTLEBLOWER_CONTRACT.address 
    });
    
    if (!code || code === '0x') {
      throw new Error('Contract not deployed at this address');
    }

    // Check report count
    const count = await publicClient.readContract({
      ...ZKWHISTLEBLOWER_CONTRACT,
      functionName: 'reportCount'
    });

    console.log('Current report count:', count);
    
    // Check skip verification status (should be false in production)
    const skipVerification = await publicClient.readContract({
      ...ZKWHISTLEBLOWER_CONTRACT,
      functionName: 'skipVerification'
    });
    
    console.log('Skip verification:', skipVerification);
    if (skipVerification) {
      console.warn('⚠️ WARNING: Skip verification is enabled! This should be false in production.');
    }

    return true;
  } catch (error) {
    console.error('Contract state check failed:', error);
    throw error;
  }
}

// Get reports for organization
export const getReportsForOrganization = async (orgId: bigint): Promise<any[]> => {
  console.log(`Getting reports for organization with ID: ${orgId}`);
  return [];
};

// Get report by ID
export async function getReport(reportId: bigint) {
  try {
    const result = await publicClient.readContract({
      ...ZKWHISTLEBLOWER_CONTRACT,
      functionName: 'getReport',
      args: [reportId]
    });
    
    console.log('Report data from contract:', result);
    
    // The result is a tuple with the Report struct
    // We need to access it properly based on the ABI
    return {
      title: result.title,
      content: result.content,
      timestamp: result.timestamp,
      organizationHash: result.organizationHash
    };
  } catch (error) {
    console.error('Error fetching report:', error);
    throw error;
  }
}

// Add this function at the end of the file
export async function testZkWhistleblowerContract() {
  try {
    console.log('Testing ZkWhistleblower contract at:', ZKWHISTLEBLOWER_CONTRACT.address);
    
    // Check if contract is deployed
    const code = await publicClient.getBytecode({ 
      address: ZKWHISTLEBLOWER_CONTRACT.address 
    });
    
    if (!code || code === '0x') {
      throw new Error('Contract not deployed at this address');
    }
    console.log('✅ Contract is deployed');
    
    // Check reportCount
    const count = await publicClient.readContract({
      ...ZKWHISTLEBLOWER_CONTRACT,
      functionName: 'reportCount'
    });
    console.log('✅ Current report count:', count);
    
    // Check skip verification status
    const skipVerification = await publicClient.readContract({
      ...ZKWHISTLEBLOWER_CONTRACT,
      functionName: 'skipVerification'
    });
    console.log('✅ Skip verification:', skipVerification);
    
    return {
      deployed: true,
      reportCount: count,
      skipVerification
    };
  } catch (error) {
    console.error('❌ Contract test failed:', error);
    throw error;
  }
}

// Add a debug function to manually verify if the hash calculation is consistent with the smart contract
export async function verifyReportHashOnChain(title: string, content: string, expectedHash: string) {
  try {
    // This is a read-only function call to test hash calculation
    console.log(`Testing hash calculation for: "${title}|${content}"`);
    console.log(`Expected hash: ${expectedHash}`);
    
    // Calculate the hash client-side using the same method as the contract
    const clientHash = keccak256(toHex(title + "|" + content));
    console.log(`Client-side hash: ${clientHash}`);
    
    // Convert the hash to the format the contract expects
    const clientHashBigInt = BigInt(clientHash);
    console.log(`Client-side hash as BigInt: ${clientHashBigInt}`);
    
    // Check if the hashes match
    const expectedHashBigInt = BigInt(expectedHash);
    const match = clientHashBigInt === expectedHashBigInt;
    console.log(`Hashes match: ${match}`);
    
    return {
      match,
      clientHash,
      expectedHash
    };
  } catch (error) {
    console.error('Error verifying hash:', error);
    throw error;
  }
}

// Helper function to get the explorer transaction URL
export function getExplorerTransactionUrl(txHash: string): string {
  return `https://base-sepolia.blockscout.com/tx/${txHash}`;
} 