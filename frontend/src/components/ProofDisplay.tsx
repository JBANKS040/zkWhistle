import { Box, Text, VStack, Heading, Code, Divider } from '@chakra-ui/react';
import { ReportForm } from './ReportForm';
import { ProofStatus } from './ProofStatus';
import { useState, useEffect } from 'react';

interface ProofDisplayProps {
  proof: any;
  decodedJwt: {
    rawJwt: string;
    header: any;
    payload: any;
    signature: string;
  } | null;
}

export function ProofDisplay({ proof, decodedJwt }: ProofDisplayProps) {
  const [isVerified, setIsVerified] = useState(false);
  
  useEffect(() => {
    console.log("Current isVerified state:", isVerified);
  }, [isVerified]);

  const handleVerificationSuccess = () => {
    console.log("Verification success callback triggered");
    setIsVerified(true);
  };
  
  if (!decodedJwt) return null;

  return (
    <VStack spacing={6} align="stretch" w="full">
      <ProofStatus 
        proof={proof} 
        decodedJwt={decodedJwt}
        onVerificationSuccess={handleVerificationSuccess}
      />

      <Box>
        <Heading size="md" mb={4}>Decoded JWT</Heading>
        <Code 
          p={4} 
          borderRadius="md" 
          whiteSpace="pre-wrap" 
          display="block"
          bg="gray.50"
        >
          {JSON.stringify({
            rawJwt: decodedJwt.rawJwt,
            header: decodedJwt.header,
            payload: decodedJwt.payload,
            signature: decodedJwt.signature
          }, null, 2)}
        </Code>
      </Box>

      {proof && (
        <>
          <Box>
            <Heading size="md" mb={4}>Generated Proof</Heading>
            <Code 
              p={4} 
              borderRadius="md" 
              whiteSpace="pre-wrap" 
              display="block"
              bg="gray.50"
            >
              {JSON.stringify(proof, null, 2)}
            </Code>
          </Box>

          {isVerified && (
            <>
              <Divider />
              <Box>
                <Heading size="md" mb={4}>Submit Report</Heading>
                <ReportForm 
                  organizationHash={BigInt(proof.publicSignals.organization_hash)}
                  organizationName={decodedJwt.payload.email.split('@')[1]}
                />
              </Box>
            </>
          )}
        </>
      )}
    </VStack>
  );
} 