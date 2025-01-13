import { NextApiRequest, NextApiResponse } from 'next';
import { generateEmailJWTInputs } from '@/helpers/email-jwt-inputs';
import { getGooglePublicKey } from '@/helpers/rsa-utils';
import { EmailJWTCircuitInputs } from '@/types/circuit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { jwt } = req.body;
    if (!jwt) {
      return res.status(400).json({ error: 'Missing JWT' });
    }

    const [header] = jwt.split('.');
    const { kid } = JSON.parse(Buffer.from(header, 'base64').toString());
    const publicKey = await getGooglePublicKey(kid);

    const circuitInputs = await generateEmailJWTInputs(jwt, publicKey);
    
    // Convert BigInts to strings before sending
    const serializedInputs = {
      ...circuitInputs,
      message: circuitInputs.message.map(n => n.toString()),
      pubkey: circuitInputs.pubkey.map(n => n.toString()),
      signature: circuitInputs.signature.map(n => n.toString())
    };

    return res.status(200).json(serializedInputs);

  } catch (error: any) {
    console.error('Error generating circuit inputs:', error);
    return res.status(500).json({ 
      error: String(error),
      jwt_length: req.body.jwt?.length
    });
  }
} 

