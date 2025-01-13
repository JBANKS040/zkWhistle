import { Box, Text, VStack, Heading, Code } from '@chakra-ui/react';

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
  if (!decodedJwt) return null;

  return (
    <VStack spacing={6} align="stretch" w="full">
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
      )}
    </VStack>
  );
} 