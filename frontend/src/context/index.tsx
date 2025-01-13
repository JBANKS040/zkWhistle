'use client'

import { ChakraProvider } from '@chakra-ui/react'
import { WagmiConfig } from 'wagmi'
import { config } from '@/config/wagmi'
import { theme } from '@/theme'
import { MetaMaskProvider } from '@/providers/MetaMaskProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiConfig config={config}>
      <ChakraProvider theme={theme}>
        <MetaMaskProvider>
          {children}
        </MetaMaskProvider>
      </ChakraProvider>
    </WagmiConfig>
  )
} 