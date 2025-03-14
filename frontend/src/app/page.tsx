'use client'

import { Box, Container, Flex, Heading, Spacer } from '@chakra-ui/react';
import { WalletConnect } from '@/components/WalletConnect';
import { ReportFlow } from '@/components/ReportFlow';

export default function Page() {
  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="container.xl" py={4}>
        <Flex mb={8} align="center">
          <Spacer />
          <WalletConnect />
        </Flex>
        
        <Flex direction="column" align="center" mb={12}>
          <Heading 
            size="2xl" 
            bgGradient="linear(to-r, blue.500, purple.500)"
            bgClip="text"
            mb={12}
            textAlign="center"
          >
            ZK Whistle
          </Heading>
          
          <Box w="full" maxW="4xl">
            <ReportFlow />
          </Box>
        </Flex>
      </Container>
    </Box>
  );
}
