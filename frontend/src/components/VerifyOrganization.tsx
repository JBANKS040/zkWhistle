'use client'

import { VStack } from '@chakra-ui/react';
import { ProofStatus } from './ProofStatus';
import { GoogleSignIn } from './GoogleSignIn';
import { useEffect, useState } from 'react';
import { getVerifiedOrganization } from '@/helpers/contract-utils';

interface VerifyOrganizationProps {
  proof: any;
  decodedJwt: {
    rawJwt: string;
    header: any;
    payload: any;
    signature: string;
  } | null;
  publicSignals: any;
  onVerificationSuccess?: () => void;
  onJWTReceived: (jwt: string) => void;
}

export function VerifyOrganization({ 
  proof, 
  decodedJwt,
  publicSignals,
  onVerificationSuccess, 
  onJWTReceived 
}: VerifyOrganizationProps) {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkVerification = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          if (accounts[0]) {
            const orgHash = await getVerifiedOrganization(accounts[0]);
            const isVerified = orgHash !== BigInt(0);
            setIsVerified(isVerified);
            if (isVerified) {
              onVerificationSuccess?.();
            }
          }
        } catch (error) {
          console.error('Error checking verification:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    checkVerification();
  }, [proof, onVerificationSuccess]);

  if (isLoading) {
    return <div>Checking verification status...</div>;
  }

  return (
    <VStack spacing={8}>
      {!isVerified && <GoogleSignIn onJWTReceived={onJWTReceived} />}
      {(proof || decodedJwt) && !isVerified && (
        <ProofStatus 
          proof={proof} 
          decodedJwt={decodedJwt}
          publicSignals={publicSignals}
          onVerificationSuccess={() => {
            setIsVerified(true);
            onVerificationSuccess?.();
          }} 
        />
      )}
      {isVerified && (
        <div>Organization verified! You can now submit reports. ✓</div>
      )}
    </VStack>
  );
} 