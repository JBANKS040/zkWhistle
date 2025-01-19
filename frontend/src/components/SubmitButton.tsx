'use client'

import { Button, useToast } from '@chakra-ui/react';

interface SubmitButtonProps {
  proof: any;
  publicSignals: any;
  isLoading: boolean;
  onClick: (proof: any) => Promise<void>;
}

export function SubmitButton({ 
  proof, 
  publicSignals, 
  isLoading,
  onClick 
}: SubmitButtonProps) {
  const toast = useToast();

  const handleClick = async () => {
    try {
      await onClick({ proof, publicSignals });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit proof',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Button
      colorScheme="blue"
      onClick={handleClick}
      isLoading={isLoading}
      loadingText="Submitting..."
    >
      Submit Proof
    </Button>
  );
} 