import { NextApiRequest, NextApiResponse } from 'next';
import { generateEmailJWTInputs } from '@/helpers/email-jwt-inputs';
import { getGooglePublicKey } from '@/helpers/rsa-utils';

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

    console.log('🔑 Fetching Google public key...');
    const [header] = jwt.split('.');
    const { kid } = JSON.parse(Buffer.from(header, 'base64').toString());
    const publicKey = await getGooglePublicKey(kid);
    console.log('✅ Public key fetched:', { kid, n: publicKey.n.slice(0, 20) + '...' });

    console.log('🔄 Generating circuit inputs...');
    const circuitInputs = await generateEmailJWTInputs(jwt, publicKey);
    console.log('📊 Raw circuit inputs:', {
      messageLength: circuitInputs.message.length,
      pubkeyLength: circuitInputs.pubkey.length,
      signatureLength: circuitInputs.signature.length,
      periodIndex: circuitInputs.periodIndex,
      emailDomainIndex: circuitInputs.emailDomainIndex,
      emailDomainLength: circuitInputs.emailDomainLength
    });

    // Convert BigInts to strings for JSON serialization
    const serializedInputs = {
      message: circuitInputs.message.map(n => n.toString()),
      messageLength: circuitInputs.messageLength,
      pubkey: circuitInputs.pubkey.map(n => n.toString()),
      signature: circuitInputs.signature.map(n => n.toString()),
      periodIndex: circuitInputs.periodIndex,
      emailDomainIndex: circuitInputs.emailDomainIndex,
      emailDomainLength: circuitInputs.emailDomainLength
    };

    console.log('✅ Circuit inputs generated successfully');
    return res.status(200).json(serializedInputs);

  } catch (error: any) {
    console.error('❌ Error generating inputs:', {
      message: error.message,
      stack: error.stack
    });
    return res.status(500).json({ error: String(error) });
  }
} 

