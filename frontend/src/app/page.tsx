'use client'

import { HomePage } from '@/components/HomePage'
import { Box, Container } from '@chakra-ui/react'

export default function Page() {
  return (
    <Container maxW="container.xl" py={8}>
      <Box 
        bg="white" 
        borderRadius="xl" 
        boxShadow="sm"
        overflow="hidden"
      >
        <HomePage />
      </Box>
    </Container>
  )
}
