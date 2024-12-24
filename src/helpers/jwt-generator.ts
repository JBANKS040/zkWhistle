import NodeRSA from 'node-rsa';
import type { JWTComponents } from '@zk-email/jwt-tx-builder-helpers/src/types';

export function generateJWT(header: object, payload: object): JWTComponents {
  const key = new NodeRSA();
  key.generateKeyPair(2048, 65537);

  const headerString = Buffer.from(JSON.stringify(header)).toString('base64');
  const payloadString = Buffer.from(JSON.stringify(payload)).toString('base64');

  const signature = key.sign(Buffer.from(`${headerString}.${payloadString}`), 'base64', 'utf8');

  const rawJWT = `${headerString}.${payloadString}.${signature}`;
  const publicKey = {
    n: key.exportKey('components').n.toString('base64'),
    e: key.exportKey('components').e,
  };

  return {
    rawJWT,
    publicKey: {
      ...publicKey,
      e: typeof publicKey.e === 'number' ? publicKey.e : parseInt(publicKey.e.toString('hex'), 16),
    },
  };
}
