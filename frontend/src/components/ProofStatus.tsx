'use client'

import { useState, useEffect } from 'react';
import { Circle, HStack, Text, VStack, Button, Spinner, Box, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Link, Code, useToast } from '@chakra-ui/react';
import { submitReport, getOrganizationName } from '@/helpers/contract-utils';
import { CheckIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { publicClient } from '@/lib/ethers';
import { generateReportHash } from '@/helpers/proof-utils';

type Status = 'pending' | 'success' | 'loading';

interface StepStatus {
  jwtGeneration: Status;
  proofGeneration: Status;
  proofComplete: Status;
  contractSubmission: Status;
}

interface ProofStatusProps {
  proof: any;
  onSubmitComplete?: (txHash: string) => void;
  title?: string;
  content?: string;
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

export function ProofStatus({ proof, onSubmitComplete, title = "", content = "" }: ProofStatusProps) {
  const [txHash, setTxHash] = useState<string | null>(null);
  const [status, setStatus] = useState<StepStatus>({
    jwtGeneration: 'success',
    proofGeneration: 'loading',
    proofComplete: 'pending',
    contractSubmission: 'pending'
  });
  const [receipt, setReceipt] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const [orgName, setOrgName] = useState<string>('');
  const publicSignals = proof?.publicSignals;

  // Get the organization name based on hash
  useEffect(() => {
    if (proof && proof.publicSignals) {
      try {
        // Extract organization hash from the public signals
        const organizationHash = proof.publicSignals[0];
        
        if (organizationHash) {
          // Convert to BigInt if it's a string
          const orgHashBigInt = typeof organizationHash === 'string' 
            ? BigInt(organizationHash) 
            : BigInt(organizationHash.toString());
          
          // Call the synchronous function
          const name = getOrganizationName(orgHashBigInt);
          setOrgName(name);
        }
      } catch (error) {
        console.error('Error getting organization name:', error);
        setOrgName('Unknown Organization');
      }
    }
  }, [proof]);

  // Update proof generation status when proof becomes available
  useEffect(() => {
    if (proof && proof.proof && proof.publicSignals) {
      // Check if proof has necessary data
      if (
        proof.proof.pi_a && 
        proof.proof.pi_b && 
        proof.proof.pi_c && 
        proof.publicSignals.organization_hash && 
        proof.publicSignals.report_hash
      ) {
        console.log("Proof data detected, updating status to complete");
        setStatus(prev => ({
          ...prev,
          proofGeneration: 'success',
          proofComplete: 'success'
        }));
      }
    }
  }, [proof]);

  // Handle proof submission to the contract
  const handleSubmitProof = async () => {
    if (!proof) {
      toast({
        title: "Error",
        description: "No proof available to submit",
        status: "error",
        duration: 5000,
      });
      return;
    }

    // Use the original title/content from the proof if available, otherwise use the provided props
    const submissionTitle = proof.originalTitle || title;
    const submissionContent = proof.originalContent || content;
    
    // Make sure we have content to submit
    if (!submissionTitle || !submissionContent) {
      toast({
        title: "Error",
        description: "Report title and content are required",
        status: "error",
        duration: 5000,
      });
      return;
    }

    setSubmitting(true);
    setStatus(prev => ({
      ...prev,
      contractSubmission: 'loading'
    }));

    try {
      // Submit proof to contract with the EXACT SAME title and content used for proof generation
      console.log("Submitting with title/content:", {
        titleLength: submissionTitle.length,
        contentLength: submissionContent.length
      });
      
      const result = await submitReport(
        submissionTitle,
        submissionContent, 
        proof.proof, 
        proof.publicSignals
      );
      
      // Extract the transaction hash from the result object
      const transactionHash = result.transactionHash;
      console.log("Transaction hash:", transactionHash);

      // Transaction hash should already be properly formatted as 0x-prefixed hex string
      const hashHex = transactionHash as string;
      console.log("Using transaction hash for receipt lookup:", hashHex);

      setTxHash(hashHex);

      // Update status
      setStatus(prev => ({
        ...prev,
        contractSubmission: 'success'
      }));

      try {
        // Wait for transaction confirmation
        const receipt = await publicClient.waitForTransactionReceipt({ 
          hash: hashHex as `0x${string}`,
          confirmations: 1
        });
        
        setReceipt(receipt);
        console.log("Transaction confirmed:", receipt);
        
        toast({
          title: "Report Submitted",
          description: "Transaction confirmed successfully.",
          status: "success",
          duration: 5000,
        });

        onSubmitComplete?.(hashHex);
      } catch (receiptError) {
        console.error("Error getting receipt but transaction was submitted:", receiptError);
        
        // Even if we can't confirm the receipt, the transaction was submitted
        toast({
          title: "Report Submitted",
          description: "Transaction was submitted, but we couldn't confirm it. You can check the status on the blockchain explorer.",
          status: "warning",
          duration: 5000,
        });
        
        // Still trigger the success callback since we have a transaction hash
        onSubmitComplete?.(hashHex);
      }
    } catch (error) {
      console.error("Error submitting proof:", error);
      
      setStatus(prev => ({
        ...prev,
        contractSubmission: 'pending'
      }));
      
      toast({
        title: "Error",
        description: `Failed to submit proof: ${error instanceof Error ? error.message : String(error)}`,
        status: "error",
        duration: 5000,
      });
    } finally {
      setSubmitting(false);
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

      {orgName && (
        <div className="text-sm text-gray-600">
          Organization proven: {orgName}
        </div>
      )}
      
      {title && content && proof?.publicSignals?.report_hash && proof.publicSignals.report_hash !== "0" && (
        <div className="text-sm text-gray-600">
          Report hash: {proof.publicSignals.report_hash.substring(0, 10)}...
        </div>
      )}

      {proof && !txHash && (
        <Button
          colorScheme="blue"
          isLoading={submitting}
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
            href={`https://base-sepolia.blockscout.com/tx/${txHash}`}
            isExternal
            color="blue.500"
          >
            View on Blockscout <ExternalLinkIcon mx="2px" />
          </Link>
        </Box>
      )}
    </VStack>
  );
} 