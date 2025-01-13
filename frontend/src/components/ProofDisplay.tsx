import { Box, VStack, Text, Code, Heading } from '@chakra-ui/react'

interface ProofDisplayProps {
  proof: any
  decodedJwt: {
    header: any
    payload: any
    signature: string
  } | null
}

export function ProofDisplay({ proof, decodedJwt }: ProofDisplayProps) {
  return (
    <VStack spacing={4} width="100%" align="stretch">
      {decodedJwt && (
        <Box>
          <Heading size="md" mb={2}>Decoded JWT</Heading>
          <Code p={2} borderRadius="md" width="100%">
            <pre>{JSON.stringify(decodedJwt, null, 2)}</pre>
          </Code>
        </Box>
      )}
      
      {proof && (
        <Box>
          <Heading size="md" mb={2}>Generated Proof</Heading>
          <Code p={2} borderRadius="md" width="100%">
            <pre>{JSON.stringify(proof, null, 2)}</pre>
          </Code>
        </Box>
      )}
    </VStack>
  )
} 