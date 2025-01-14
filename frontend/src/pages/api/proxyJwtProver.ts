import { NextApiRequest, NextApiResponse } from 'next';
import { groth16 } from 'snarkjs';
import path from 'path';
import { EmailJWTCircuitInputs } from '@/types/circuit';
import { verifyJWT } from '@/helpers/jwt-utils';
import { padArray } from '@/helpers/utils';

export const config = {
  api: {
    bodyParser: true,
    responseLimit: false,
    externalResolver: true,
    timeout: 120000 // 2 minutes
  },
};

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { input }: { input: EmailJWTCircuitInputs } = req.body;
    if (!input) {
      return res.status(400).json({ error: 'Missing input' });
    }

    // Verify JWT before generating proof
    const pubkey = {
      n: input.pubkey[0].toString(),  // Convert first element to base64 string
      e: 65537  // Google's public exponent
    };
    const isValid = await verifyJWT(input.jwt, pubkey);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid JWT' });
    }

    // Get paths to circuit files
    console.log('Loading circuit files...');
    const publicDir = path.join(process.cwd(), 'public');
    const wasmPath = path.join(publicDir, 'circuits', 'EmailJWT.wasm');
    const zkeyPath = path.join(publicDir, 'circuits', 'EmailJWT_final.zkey');
    console.log('Circuit files loaded');

    // Before generating proof, pad arrays and remove non-circuit inputs
    const { jwt, ...circuitInput } = input;
    const paddedInput = {
      ...circuitInput,
      message: padArray(input.message, 2048, BigInt(0)),
      pubkey: padArray(input.pubkey, 17, BigInt(0)),
      signature: padArray(input.signature, 17, BigInt(0))
    };

    console.log('Circuit inputs:', {
      messageLength: paddedInput.message.length,
      pubkeyLength: paddedInput.pubkey.length,
      sigLength: paddedInput.signature.length,
      periodIndex: paddedInput.periodIndex,
      // Log first few elements to check values
      messageSample: paddedInput.message.slice(0, 5).map(n => n.toString()),
      pubkeySample: paddedInput.pubkey.slice(0, 5).map(n => n.toString()),
      sigSample: paddedInput.signature.slice(0, 5).map(n => n.toString())
    });

    console.log('Starting proof generation...');
    const { proof, publicSignals } = await groth16.fullProve(
      paddedInput,
      wasmPath,
      zkeyPath
    );
    console.log('Proof generation completed');
    
    // Add detailed proof logging
    console.log('Full Proof Details:');
    console.log(JSON.stringify({
      proof: {
        pi_a: proof.pi_a,
        pi_b: proof.pi_b.map(row => row.map(n => n.toString())), // Convert BigInts to strings
        pi_c: proof.pi_c
      },
      publicSignals: {
        organization_hash: publicSignals[0],
        proof_expiry: publicSignals[1]
      }
    }, null, 2));

    // Add this logging right after proof generation
    console.log('Solidity Calldata Format:');
    console.log([
        // pA
        proof.pi_a[0].toString(),
        proof.pi_a[1].toString(),
        // pB (needs to be flattened)
        proof.pi_b[0][0].toString(),
        proof.pi_b[0][1].toString(),
        proof.pi_b[1][0].toString(),
        proof.pi_b[1][1].toString(),
        // pC
        proof.pi_c[0].toString(),
        proof.pi_c[1].toString(),
        // public inputs
        publicSignals[0].toString(),
        publicSignals[1].toString()
    ]);

    // After proof generation, before the return statement
    console.log('Proof for Solidity Test:');
    console.log(`
    // pA
    uint256[2] memory pA = [
        ${proof.pi_a[0]},
        ${proof.pi_a[1]}
    ];
    
    uint256[2][2] memory pB = [
        [
            ${proof.pi_b[0][0]},
            ${proof.pi_b[0][1]}
        ],
        [
            ${proof.pi_b[1][0]},
            ${proof.pi_b[1][1]}
        ]
    ];
    
    uint256[2] memory pC = [
        ${proof.pi_c[0]},
        ${proof.pi_c[1]}
    ];

    uint256[2] memory pubSignals = [
        ${publicSignals[0]},  // organization_hash
        ${publicSignals[1]}   // proof_expiry
    ];
    `);

    return res.status(200).json({
      proof: {
        pi_a: proof.pi_a,
        pi_b: proof.pi_b,
        pi_c: proof.pi_c,
        protocol: "groth16"
      },
      publicSignals: {
        organization_hash: publicSignals[0],
        proof_expiry: publicSignals[1]
      }
    });

  } catch (error: any) {
    console.error('Proof generation error:', error);
    return res.status(500).json({
      error: 'Proof generation failed',
      details: error.message
    });
  }
} 