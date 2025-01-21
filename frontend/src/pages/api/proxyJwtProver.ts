import { NextApiRequest, NextApiResponse } from 'next';
import { groth16 } from 'snarkjs';
import path from 'path';

const CIRCUIT_FILES = {
  wasm: path.join(process.cwd(), 'public/circuits/EmailJWT.wasm'),
  zkey: path.join(process.cwd(), 'public/circuits/EmailJWT_final.zkey')
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    console.log('Backend: Starting proof generation...');
    const { input } = req.body;
    
    if (!input) {
      return res.status(400).json({ error: 'Missing input' });
    }

    console.log('Backend: Input received:', {
      messageLength: input.message?.length,
      pubkeyLength: input.pubkey?.length,
      signatureLength: input.signature?.length
    });

    const { proof, publicSignals } = await groth16.fullProve(
      input,
      CIRCUIT_FILES.wasm,
      CIRCUIT_FILES.zkey
    );

    console.log('Backend: Proof generated successfully');

    return res.status(200).json({
      proof,
      publicSignals: {
        organization_hash: publicSignals[0]
      }
    });

  } catch (error: any) {
    console.error('Backend error:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
} 