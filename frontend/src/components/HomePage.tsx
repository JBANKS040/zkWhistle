'use client'

import { useState, useEffect } from 'react'
import { Box, Container, VStack, Input, Text, Heading, Card, CardBody } from '@chakra-ui/react'
import { generateProof } from '@/helpers/proof-utils'
import axios from 'axios'
import { StepsIndicator } from './StepsIndicator'
import { ProofDisplay } from './ProofDisplay'

export function HomePage() {
  const [step, setStep] = useState<'initial' | 'jwt' | 'proving' | 'proved' | 'submitting'>('initial')
  const [jwt, setJwt] = useState('')
  const [proof, setProof] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [decodedJwt, setDecodedJwt] = useState<{
    rawJwt: string
    header: any
    payload: any
    signature: string
  } | null>(null)

  const handleCredentialResponse = async (response: { credential: string }) => {
    try {
      const jwt = response.credential
      console.log('JWT received:', jwt)
      
      // Decode JWT parts
      const [header, payload] = jwt.split('.').slice(0, 2)
      const decodedHeader = JSON.parse(atob(header))
      const decodedPayload = JSON.parse(atob(payload))
      
      setDecodedJwt({
        rawJwt: jwt,
        header: decodedHeader,
        payload: decodedPayload,
        signature: jwt.split('.')[2]
      })

      setStep('jwt')
      setStep('proving')

      // Generate proof with just the JWT
      const result = await generateProof(jwt, null)
      if (result) {
        setProof(result)
        setStep('proved')
      }
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to process JWT')
      setStep('initial')
    }
  }

  useEffect(() => {
    // Check if google is available
    if (typeof window !== 'undefined' && window.google) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse
      })
      
      const buttonDiv = document.getElementById('googleSignInButton')
      if (buttonDiv) {
        window.google.accounts.id.renderButton(buttonDiv, {
          theme: 'outline',
          size: 'large'
        })
      }
    }
  }, [])

  return (
    <Container maxW="container.md" centerContent>
      <Box padding={8} width="100%">
        <Heading as="h1" size="2xl" textAlign="center" mb={8}>
          ZK Whistleblower
        </Heading>
        <Card>
          <CardBody>
            <VStack spacing={6}>
              {/* Status steps */}
              <StepsIndicator currentStep={step} />
              
              {/* Google Sign-in */}
              <Box id="googleSignInButton" />
              
              {/* Proof Display */}
              {proof && <ProofDisplay proof={proof} decodedJwt={decodedJwt} />}
              
              {/* Error Display */}
              {error && (
                <Text color="red.500">{error}</Text>
              )}
            </VStack>
          </CardBody>
        </Card>
      </Box>
    </Container>
  )
}