'use client'

import { useState, Suspense } from 'react';
import {
  Box,
  Container,
  Text,
  VStack,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Code,
  Link,
} from '@chakra-ui/react';
import { CheckCircleIcon, TimeIcon, WarningIcon } from '@chakra-ui/icons';
import styled from '@emotion/styled';
import { generateProof } from '@/helpers/proof-utils';
import { getGooglePublicKey } from '@/helpers/rsa-utils';
import { GoogleSignIn } from '@/components/GoogleSignIn'
import { SubmitButton } from '@/components/SubmitButton';
import { WalletConnect } from '@/components/WalletConnect';
import { verifyProofWithWallet } from '@/helpers/contract-utils';

// Type definitions
interface Step {
  title: string;
  description: string;
}

interface DecodedJWT {
  rawJwt: string;
  header: any;
  payload: any;
  signature: string;
}

interface ProofData {
  proof: any;
  publicSignals: {
    organization_hash: string;
  };
}

interface TransactionInfo {
  hash: string;
  status?: 'pending' | 'success' | 'failed';
  error?: string;
}

// Styled components
const StepBox = styled(Box)`
  display: flex;
  align-items: center;
  gap: 2;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.2s;
  font-family: var(--font-geist-sans);
  font-weight: 500;

  &[data-status='success'] {
    background: #f0fff4;
    color: #2f855a;
  }

  &[data-status='processing'] {
    background: #ebf8ff;
    color: #2b6cb0;
  }

  &[data-status='failed'] {
    background: #fff5f5;
    color: #c53030;
  }

  &[data-status='idle'] {
    background: #f7fafc;
    color: #718096;
  }
`;

const DataSection = styled(Box)`
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
  font-family: var(--font-geist-mono);
  font-size: 14px;
`;

const DataTitle = styled(Text)`
  font-family: var(--font-geist-sans);
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 8px;
`;

export default function Page() {
  // State management
  const [stepStatuses, setStepStatuses] = useState<string[]>(['idle', 'idle', 'idle', 'idle']);
  const [decodedJwt, setDecodedJwt] = useState<DecodedJWT | null>(null);
  const [proof, setProof] = useState<ProofData | null>(null);
  const [transaction, setTransaction] = useState<TransactionInfo | null>(null);

  const steps: Step[] = [
    { title: 'JWT Generation', description: 'Generating JWT' },
    { title: 'Proof Generation', description: 'Starting proof generation' },
    { title: 'Proof Complete', description: 'Proof generation completed' },
    { title: 'Submit to Contract', description: 'Submitting proof to contract' },
  ];

  // Helper functions
  const renderStepStatus = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon color="green.500" />;
      case 'processing':
        return <TimeIcon color="blue.500" />;
      case 'failed':
        return <WarningIcon color="red.500" />;
      default:
        return <CheckCircleIcon color="gray.300" />;
    }
  };

  const handleCredentialResponse = async (jwt: string) => {
    try {
      setStepStatuses(['success', 'processing', 'idle', 'idle']);

      // Decode JWT
      const [headerB64, payloadB64, signatureB64] = jwt.split('.');
      const header = JSON.parse(Buffer.from(headerB64, 'base64').toString());
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());

      setDecodedJwt({
        rawJwt: jwt,
        header,
        payload,
        signature: signatureB64
      });

      // Get public key and generate proof
      const pubkey = await getGooglePublicKey(header.kid);
      const proofResult = await generateProof(jwt, pubkey);
      
      if (proofResult) {
        const formattedProof = {
          proof: {
            pi_a: proofResult.proof.pi_a.slice(0, 2),
            pi_b: proofResult.proof.pi_b.map((row: string[]) => row.slice(0, 2)),
            pi_c: proofResult.proof.pi_c.slice(0, 2)
          },
          publicSignals: {
            organization_hash: proofResult.publicSignals.organization_hash
          }
        };
        
        console.log('Setting proof:', formattedProof);  // Debug log
        setProof(formattedProof);
        setStepStatuses(['success', 'success', 'success', 'idle']);
      }

    } catch (error) {
      console.error('Error:', error);
      setStepStatuses(['success', 'failed', 'idle', 'idle']);
    }
  };

  const handleProofSubmission = async (proof: ProofData) => {
    try {
      const hash = await verifyProofWithWallet(proof.proof, proof.publicSignals);
      setTransaction({
        hash,
        status: 'pending'
      });
    } catch (error) {
      console.error('Failed to submit proof:', error);
      setTransaction({
        hash: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Suspense fallback={null}>
        <Box bg="white" borderRadius="xl" boxShadow="sm" overflow="hidden" p={6}>
          <WalletConnect />
          
          <VStack spacing={4} width="100%" mb={8}>
            {steps.map((step, index) => (
              <StepBox key={index} data-status={stepStatuses[index]} width="100%">
                {renderStepStatus(stepStatuses[index])}
                <Text ml={2}>{step.title}</Text>
              </StepBox>
            ))}
          </VStack>

          <GoogleSignIn onJWTReceived={handleCredentialResponse} />

          {proof && (
            <Box mt={4} textAlign="center">
              <SubmitButton 
                proof={proof.proof}
                publicSignals={proof.publicSignals}
                onClick={() => handleProofSubmission(proof)}
                isLoading={stepStatuses[3] === 'processing'}
              />
            </Box>
          )}

          {decodedJwt && (
            <Accordion allowMultiple width="100%" mt={4}>
              <AccordionItem>
                <AccordionButton>
                  <DataTitle>JWT Details</DataTitle>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel>
                  <DataSection>
                    <Text fontWeight="600" mb={2}>Raw JWT</Text>
                    <Code p={4} borderRadius="md" width="100%" overflowX="auto">
                      {decodedJwt.rawJwt}
                    </Code>
                    
                    <Text fontWeight="600" mt={4} mb={2}>Header</Text>
                    <Code p={4} borderRadius="md" width="100%">
                      {JSON.stringify(decodedJwt.header, null, 2)}
                    </Code>
                    
                    <Text fontWeight="600" mt={4} mb={2}>Payload</Text>
                    <Code p={4} borderRadius="md" width="100%">
                      {JSON.stringify(decodedJwt.payload, null, 2)}
                    </Code>
                  </DataSection>
                </AccordionPanel>
              </AccordionItem>
              
              {proof && (
                <AccordionItem>
                  <AccordionButton>
                    <DataTitle>Generated Proof</DataTitle>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel>
                    <DataSection>
                      <Code p={4} borderRadius="md" width="100%">
                        {JSON.stringify(proof, null, 2)}
                      </Code>
                    </DataSection>
                  </AccordionPanel>
                </AccordionItem>
              )}

              {transaction && (
                <AccordionItem>
                  <AccordionButton>
                    <DataTitle>Transaction</DataTitle>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel>
                    <DataSection>
                      {transaction.status === 'failed' ? (
                        <>
                          <Text fontWeight="600" color="red.500" mb={2}>Transaction Failed</Text>
                          <Code p={4} borderRadius="md" width="100%" bg="red.50">
                            {transaction.error}
                          </Code>
                        </>
                      ) : (
                        <>
                          <Text fontWeight="600" mb={2}>Transaction Hash</Text>
                          <Code p={4} borderRadius="md" width="100%" overflowX="auto">
                            {transaction.hash}
                          </Code>
                          
                          <Box mt={4}>
                            <Link 
                              href={`https://sepolia.basescan.org/tx/${transaction.hash}`}
                              isExternal
                              color="blue.500"
                              textDecoration="underline"
                            >
                              View on BaseScan
                            </Link>
                          </Box>
                        </>
                      )}
                    </DataSection>
                  </AccordionPanel>
                </AccordionItem>
              )}
            </Accordion>
          )}
        </Box>
      </Suspense>
    </Container>
  );
}
