import { createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { http } from 'viem'
import { walletConnect } from 'wagmi/connectors'
import { metaMask } from 'wagmi/connectors'

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!

export const config = createConfig({
  chains: [sepolia],
  connectors: [
    metaMask(),
    walletConnect({
      projectId,
      metadata: {
        name: 'zkWhistle',
        description: 'Whistleblower dApp',
        url: 'http://localhost:3000', // Update this for production
        icons: ['https://avatars.githubusercontent.com/u/37784886']
      },
    }),
  ],
  transports: {
    [sepolia.id]: http()
  },
}) 