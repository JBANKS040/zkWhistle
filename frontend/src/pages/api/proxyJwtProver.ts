import { NextApiRequest, NextApiResponse } from 'next';
import { groth16 } from 'snarkjs';

const CIRCUIT_ARTIFACTS = {
  WASM_URL: `https://ipfs.io/ipfs/bafybeifbrj6kkysc5h6ewsw7x7gaj7ie6k4ycv63ol6cen3acumlfp7odm/EmailJWT.wasm`,
  ZKEY_URL: `https://ipfs.io/ipfs/bafybeiabhrxz4p225vwunus5muzznwgjyof7wyv4wxgjgrailwngemz63i/EmailJWT_final.zkey`
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
      signatureLength: input.signature?.length,
      hasReportContent: !!input.reportContentHash
    });

    const { proof, publicSignals } = await groth16.fullProve(
      input,
      CIRCUIT_ARTIFACTS.WASM_URL,
      CIRCUIT_ARTIFACTS.ZKEY_URL
    );

    console.log('Backend: Proof generated successfully');
    console.log('Backend: Public signals:', publicSignals.map(String));

    return res.status(200).json({
      proof,
      publicSignals: {
        organization_hash: publicSignals[0],
        report_hash: publicSignals[1]
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