import { NextApiRequest, NextApiResponse } from 'next'
import { ethers } from 'ethers'
import { WHISTLEBLOWER_CONTRACT } from '@/config/contracts'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { proof, publicSignals, encryptedData } = req.body

    // Format proof for contract submission
    const formattedArgs = {
      pA: proof.pi_a,
      pB: proof.pi_b,
      pC: proof.pi_c,
      pubSignals: publicSignals,
      encryptedData: encryptedData || "0x"
    }

    // Return the formatted arguments for client-side submission
    res.status(200).json(formattedArgs)
  } catch (error) {
    console.error('Error formatting proof:', error)
    res.status(500).json({ error: 'Failed to format proof for contract' })
  }
}