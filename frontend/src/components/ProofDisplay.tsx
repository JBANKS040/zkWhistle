import { Box, Text, VStack, Heading, Code, Divider, useToast, Link } from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { ReportSubmission } from './ReportSubmission';
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
  const toast = useToast();
  const [isVerified, setIsVerified] = useState(() => {
    const verified = localStorage.getItem('isVerified') === 'true';
    console.log("Initial isVerified:", verified); // Debug log
    return verified;
  });
  const [txHash, setTxHash] = useState<string | null>(() => {
    const hash = localStorage.getItem('txHash');
    console.log("Initial txHash:", hash); // Debug log
    return hash;
  });
  
  useEffect(() => {
    console.log("Current isVerified state:", isVerified);
  }, [isVerified]);

  const handleVerificationSuccess = (hash: string) => {
    console.log("Verification success with hash:", hash); // Debug log
    setIsVerified(true);
    setTxHash(hash);
    localStorage.setItem('isVerified', 'true');
    localStorage.setItem('txHash', hash);
  };
  
  if (!decodedJwt) return null;

  return (
    <VStack spacing={6} align="stretch" w="full">
      {isVerified ? (
        <Box p={4} borderRadius="md" borderWidth="1px" bg="green.50">
          <VStack align="start" spacing={2}>
            <Text color="green.600" fontWeight="bold">
              Organization verified! You can now submit reports. ✓
            </Text>
            {txHash && (
              <Link 
                href={`https://sepolia.basescan.org/tx/${txHash}`}
                isExternal
                color="blue.500"
                fontSize="sm"
              >
                View verification transaction <ExternalLinkIcon mx="2px" />
              </Link>
            )}
          </VStack>
        </Box>
      ) : (
        <ProofStatus 
          proof={proof} 
          decodedJwt={decodedJwt}
          publicSignals={proof?.publicSignals}
          onVerificationSuccess={handleVerificationSuccess}
        />
      )}

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
                <ReportSubmission 
                  onSuccess={(reportId) => {
                    toast({
                      title: "Report submitted",
                      description: `Report ID: ${reportId}`,
                      status: "success",
                      duration: 5000,
                      isClosable: true,
                    });
                  }}
                  onError={(error) => {
                    toast({
                      title: "Error submitting report",
                      description: error.message,
                      status: "error",
                      duration: 5000,
                      isClosable: true,
                    });
                  }}
                />
              </Box>
            </>
          )}
        </>
      )}
    </VStack>
  );
} 