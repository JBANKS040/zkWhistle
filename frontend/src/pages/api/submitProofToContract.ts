import { NextApiRequest, NextApiResponse } from 'next'
import { createPublicClient, http } from 'viem'
import { baseSepolia } from 'viem/chains'

import { abi as WhistleblowerABI } from '@/public/contracts/Whistleblower.json'
const WHISTLEBLOWER_ADDRESS = process.env.NEXT_PUBLIC_WHISTLEBLOWER_ADDRESS

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { proof, publicSignals } = req.body  // We only need proof and publicSignals here

    // Format proof for verifyProofAndRegister function
    const formattedProof = {
      pA: proof.pi_a.slice(0, 2).map(BigInt),
      pB: [
        [BigInt(proof.pi_b[0][1]), BigInt(proof.pi_b[0][0])],
        [BigInt(proof.pi_b[1][1]), BigInt(proof.pi_b[1][0])]
      ],
      pC: proof.pi_c.slice(0, 2).map(BigInt),
      pubSignals: publicSignals.map(BigInt)
    }

    // Return the formatted data for the frontend to submit via user's wallet
    res.status(200).json({
      formattedProof,
      contractAddress: WHISTLEBLOWER_ADDRESS,
      abi: WhistleblowerABI,
      functionName: 'verifyProofAndRegister'  // Specify which function to call
    })
  } catch (error) {
    console.error('Error formatting proof:', error)
    res.status(500).json({
      error: 'Failed to format proof',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}