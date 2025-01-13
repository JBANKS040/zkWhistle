import { useState, useEffect } from 'react';
import { Box, Circle, HStack, Text, VStack } from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';

type Status = 'pending' | 'success' | 'loading';

interface StepStatus {
  jwtGeneration: Status;
  proofGeneration: Status;
  proofComplete: Status;
  contractSubmission: Status;
}

export function ProofStatus({ proof }: { proof: any }) {
  const [status, setStatus] = useState<StepStatus>({
    jwtGeneration: 'pending',
    proofGeneration: 'pending',
    proofComplete: 'pending',
    contractSubmission: 'pending'
  });

  useEffect(() => {
    if (proof) {
      setStatus(prev => ({
        ...prev,
        jwtGeneration: 'success',
        proofGeneration: 'success',
        proofComplete: 'success',
        contractSubmission: 'pending'
      }));
    }
  }, [proof]);

  return (
    <HStack spacing={12} justify="center" w="full" maxW="4xl" mx="auto" my={8}>
      <Step label="JWT Generation" status={status.jwtGeneration} />
      <Step label="Proof Generation" status={status.proofGeneration} />
      <Step label="Proof Complete" status={status.proofComplete} />
      <Step label="Submit to Contract" status={status.contractSubmission} />
    </HStack>
  );
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
      </Circle>
      <Text fontSize="sm" fontWeight="medium">{label}</Text>
    </VStack>
  );
} 