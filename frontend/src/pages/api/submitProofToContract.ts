import { NextApiRequest, NextApiResponse } from 'next';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { VERIFIER_CONTRACT } from '@/config/contracts';
import { ProofData, PublicSignals } from '@/types/circuit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { proof, publicSignals } = req.body as { 
      proof: ProofData; 
      publicSignals: PublicSignals 
    };

    // Format proof for contract
    const formattedProof = {
      pA: proof.pi_a.map(x => BigInt(x)) as [bigint, bigint],
      pB: [
        [BigInt(proof.pi_b[0][1]), BigInt(proof.pi_b[0][0])], // Note the swap for G2 points
        [BigInt(proof.pi_b[1][1]), BigInt(proof.pi_b[1][0])]
      ] as [[bigint, bigint], [bigint, bigint]],
      pC: proof.pi_c.map(x => BigInt(x)) as [bigint, bigint],
      pubSignals: [BigInt(publicSignals.organization_hash)] as [bigint]
    };

    const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`);
    const client = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC)
    });

    const hash = await client.writeContract({
      ...VERIFIER_CONTRACT,
      functionName: 'verifyProof',
      args: [
        formattedProof.pA,
        formattedProof.pB,
        formattedProof.pC,
        formattedProof.pubSignals,
        publicSignals.organization_name  // Use the domain extracted from JWT
      ] as const
    });

    return res.status(200).json({ 
      success: true,
      transactionHash: hash 
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Failed to submit proof',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Helper function to submit proof from frontend
export const submitProof = async (proof: ProofData, publicSignals: PublicSignals) => {
  try {
    const response = await fetch('/api/submitProofToContract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ proof, publicSignals }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Contract response:', data);
    return data;
  } catch (error) {
    console.error('Error submitting proof:', error);
    throw error;
  }
};