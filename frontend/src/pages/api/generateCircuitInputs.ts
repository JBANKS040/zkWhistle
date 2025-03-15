import { NextApiRequest, NextApiResponse } from 'next';
import { generateEmailJWTInputs } from '@/helpers/email-jwt-inputs';
import { getGooglePublicKey } from '@/helpers/rsa-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { jwt, reportTitle, reportContent } = req.body;
    if (!jwt) {
      return res.status(400).json({ error: 'Missing JWT' });
    }

    console.log('Backend: Generating circuit inputs for JWT:', jwt.slice(0, 20) + '...');
    
    const [header, payloadB64] = jwt.split('.');
    const headerDecoded = JSON.parse(Buffer.from(header, 'base64').toString());
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
    
    // Add payload debugging
    console.log('JWT PAYLOAD DEBUG:', {
      email: payload.email,
      emailCharCodes: [...payload.email].map(c => c.charCodeAt(0))
    });
    
    const { kid } = headerDecoded;
    const publicKey = await getGooglePublicKey(kid);

    const circuitInputs = await generateEmailJWTInputs(jwt, publicKey, reportTitle, reportContent);
    
    console.log('EMAIL KEY DEBUG:', {
      email: payload.email,
      emailKeyIndex: circuitInputs.emailKeyIndex
    });

    return res.status(200).json({
      message: circuitInputs.message.map(n => n.toString()),
      messageLength: circuitInputs.messageLength,
      pubkey: circuitInputs.pubkey.map(n => n.toString()),
      signature: circuitInputs.signature.map(n => n.toString()),
      periodIndex: circuitInputs.periodIndex,
      emailKeyIndex: circuitInputs.emailKeyIndex,
      reportContentHash: circuitInputs.reportContentHash.toString()
    });

  } catch (error: any) {
    console.error('Backend error:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
} 

