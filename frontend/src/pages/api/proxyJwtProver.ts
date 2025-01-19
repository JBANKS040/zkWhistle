import { NextApiRequest, NextApiResponse } from 'next';
import { groth16 } from 'snarkjs';
import path from 'path';

const CIRCUIT_FILES = {
  wasm: './public/circuits/EmailJWT.wasm',
  zkey: './public/circuits/EmailJWT_final.zkey'
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    console.log('🔄 Starting proof generation...');
    const { input } = req.body;
    if (!input) {
      console.error('❌ Missing input');
      return res.status(400).json({ error: 'Missing input' });
    }

    console.log('📊 Input validation:', {
      messageLength: input.message.length,
      pubkeyLength: input.pubkey.length,
      signatureLength: input.signature.length,
      periodIndex: input.periodIndex,
      emailDomainIndex: input.emailDomainIndex,
      emailDomainLength: input.emailDomainLength
    });

    // Remove jwt from circuit inputs
    const { jwt, ...circuitInputs } = input;

    console.log('🔄 Generating proof with snarkjs...');
    console.log('📁 Using circuit files:', CIRCUIT_FILES);

    const { proof, publicSignals } = await groth16.fullProve(
      circuitInputs,
      CIRCUIT_FILES.wasm,
      CIRCUIT_FILES.zkey
    );

    console.log('✅ Proof generated successfully:', {
      proof: {
        pi_a: proof.pi_a.slice(0, 2) + '...',
        pi_b: proof.pi_b.slice(0, 2) + '...',
        pi_c: proof.pi_c.slice(0, 2) + '...'
      },
      publicSignals: {
        organization_hash: publicSignals[0]
      }
    });

    return res.status(200).json({
      proof,
      publicSignals: {
        organization_hash: publicSignals[0]
      }
    });

  } catch (error: any) {
    console.error('❌ Proof generation error:', {
      message: error.message,
      stack: error.stack,
      details: error.details || 'No additional details'
    });
    return res.status(500).json({
      error: 'Proof generation failed',
      details: error.message,
      stack: error.stack
    });
  }
} 