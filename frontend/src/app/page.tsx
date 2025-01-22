'use client'

import { Box, Container, Flex, Heading, Spacer } from '@chakra-ui/react';
import { WalletConnect } from '@/components/WalletConnect';
import { MainTabs } from '@/components/MainTabs';
import { useState } from 'react';
import { generateProof } from '@/helpers/proof-utils';

export default function Page() {
  const [proof, setProof] = useState<any>(null);
  const [decodedJwt, setDecodedJwt] = useState<{
    rawJwt: string;
    header: any;
    payload: any;
    signature: string;
  } | null>(null);

  const handleJWTReceived = async (jwt: string) => {
    try {
      // Decode JWT parts
      const [headerB64, payloadB64, signature] = jwt.split('.');
      const header = JSON.parse(atob(headerB64));
      const payload = JSON.parse(atob(payloadB64));
      
      console.log('Decoded JWT:', { header, payload });
      
      setDecodedJwt({
        rawJwt: jwt,
        header,
        payload,
        signature
      });

      // Generate proof immediately after receiving JWT
      console.log('Starting proof generation...');
      const generatedProof = await generateProof(jwt);
      console.log('Proof generated:', generatedProof);
      setProof(generatedProof);
    } catch (error) {
      console.error('Error processing JWT:', error);
    }
  };

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
            <MainTabs 
              proof={proof} 
              decodedJwt={decodedJwt} 
              publicSignals={proof?.publicSignals}
              onJWTReceived={handleJWTReceived}
            />
          </Box>
        </Flex>
      </Container>
    </Box>
  );
}
