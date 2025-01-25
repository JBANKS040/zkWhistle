'use client'

import { useState, useEffect } from 'react';
import { Circle, HStack, Text, VStack, Button, Spinner, Box, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Link, Code, useToast } from '@chakra-ui/react';
import { verifyProofWithWallet, getOrganizationName } from '@/helpers/contract-utils';
import { CheckIcon, ExternalLinkIcon } from '@chakra-ui/icons';

type Status = 'pending' | 'success' | 'loading';

interface StepStatus {
  jwtGeneration: Status;
  proofGeneration: Status;
  proofComplete: Status;
  contractSubmission: Status;
}

interface ProofStatusProps {
  proof: any;
  decodedJwt: {
    rawJwt: string;
    header: any;
    payload: any;
    signature: string;
  } | null;
  onVerificationSuccess?: (hash: string) => void;
  publicSignals: any;
}

function Step({ label, status }: { label: string; status: Status }) {
  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'green.500';
      case 'loading':
        return 'blue.500';
      default:
        return 'gray.200';
    }
  };

  return (
    <VStack spacing={2}>
      <Circle size="12" bg={getStatusColor()} color="white">
        {status === 'success' && <CheckIcon />}
        {status === 'loading' && <Spinner size="sm" />}
      </Circle>
      <Text fontSize="sm" fontWeight="medium">{label}</Text>
    </VStack>
  );
}

export function ProofStatus({ proof, decodedJwt, onVerificationSuccess, publicSignals }: ProofStatusProps) {
  const [txHash, setTxHash] = useState<string | null>(null);
  const [status, setStatus] = useState<StepStatus>({
    jwtGeneration: 'pending',
    proofGeneration: 'pending',
    proofComplete: 'pending',
    contractSubmission: 'pending'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const [orgName, setOrgName] = useState<string>('');

  useEffect(() => {
    if (decodedJwt) {
      console.log('JWT received in ProofStatus');
      setStatus(prev => ({
        ...prev,
        jwtGeneration: 'success',
        proofGeneration: 'loading'
      }));
    }
  }, [decodedJwt]);

  useEffect(() => {
    if (proof) {
      console.log('Proof received in ProofStatus');
      setStatus(prev => ({
        ...prev,
        proofGeneration: 'success',
        proofComplete: 'success'
      }));
    }
  }, [proof]);

  useEffect(() => {
    if (publicSignals?.organization_hash) {
      const name = getOrganizationName(BigInt(publicSignals.organization_hash));
      setOrgName(name);
    }
  }, [publicSignals]);

  const handleSubmitProof = async () => {
    if (!proof) return;
    
    setIsSubmitting(true);
    try {
      console.log('Submitting proof to contract:', {
        proof: proof.proof,
        publicSignals: proof.publicSignals
      });
      
      const hash = await verifyProofWithWallet(proof.proof, proof.publicSignals);
      console.log('Transaction submitted:', hash);
      setTxHash(hash);
      
      setStatus(prev => ({
        ...prev,
        contractSubmission: 'success'
      }));

      toast({
        title: 'Proof submitted successfully',
        description: 'Your organization verification is being processed',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onVerificationSuccess?.(hash);
    } catch (error) {
      console.error('Error submitting proof:', error);
      toast({
        title: 'Failed to submit proof',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <VStack spacing={6} w="full">
      <HStack spacing={4} w="full" justify="center">
        <Step label="JWT Generation" status={status.jwtGeneration} />
        <Text>{'>'}</Text>
        <Step label="Proof Generation" status={status.proofGeneration} />
        <Text>{'>'}</Text>
        <Step label="Proof Complete" status={status.proofComplete} />
        <Text>{'>'}</Text>
        <Step label="Submit to Contract" status={status.contractSubmission} />
      </HStack>

      {decodedJwt && (
        <Accordion allowToggle w="full">
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left" fontWeight="medium">
                  Decoded JWT
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel>
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text fontWeight="bold">Header:</Text>
                  <Code p={2} borderRadius="md" w="full">
                    {JSON.stringify(decodedJwt.header, null, 2)}
                  </Code>
                </Box>
                <Box>
                  <Text fontWeight="bold">Payload:</Text>
                  <Code p={2} borderRadius="md" w="full">
                    {JSON.stringify(decodedJwt.payload, null, 2)}
                  </Code>
                </Box>
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      )}

      {proof && (
        <Accordion allowToggle w="full">
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left" fontWeight="medium">
                  Generated Proof
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel>
              <Code p={2} borderRadius="md" w="full" whiteSpace="pre-wrap">
                {JSON.stringify({
                  proof: proof.proof,
                  publicSignals: proof.publicSignals
                }, null, 2)}
              </Code>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      )}

      {orgName && (
        <div className="text-sm text-gray-600">
          Organization proven: {orgName}
        </div>
      )}

      {proof && !txHash && (
        <Button
          colorScheme="blue"
          isLoading={isSubmitting}
          loadingText="Submitting..."
          onClick={handleSubmitProof}
          w="full"
          maxW="sm"
        >
          Submit Proof to Contract
        </Button>
      )}

      {txHash && (
        <Box w="full" textAlign="center">
          <Link 
            href={`https://sepolia.basescan.org/tx/${txHash}`}
            isExternal
            color="blue.500"
          >
            View on BaseScan <ExternalLinkIcon mx="2px" />
          </Link>
        </Box>
      )}
    </VStack>
  );
} 