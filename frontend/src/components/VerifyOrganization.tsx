'use client'

import { VStack } from '@chakra-ui/react';
import { ProofStatus } from './ProofStatus';
import { GoogleSignIn } from './GoogleSignIn';

interface VerifyOrganizationProps {
  proof: any;
  decodedJwt: {
    rawJwt: string;
    header: any;
    payload: any;
    signature: string;
  } | null;
  onVerificationSuccess?: () => void;
  onJWTReceived: (jwt: string) => void;
}

export function VerifyOrganization({ proof, decodedJwt, onVerificationSuccess, onJWTReceived }: VerifyOrganizationProps) {
  return (
    <VStack spacing={8}>
      <GoogleSignIn onJWTReceived={onJWTReceived} />
      {(proof || decodedJwt) && (
        <ProofStatus 
          proof={proof} 
          decodedJwt={decodedJwt} 
          onVerificationSuccess={onVerificationSuccess} 
        />
      )}
    </VStack>
  );
} 