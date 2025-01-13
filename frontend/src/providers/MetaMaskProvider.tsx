'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { MetaMaskSDK } from '@metamask/sdk'

const MetaMaskContext = createContext<any>(null)

export function MetaMaskProvider({ children }: { children: React.ReactNode }) {
  const [sdk, setSDK] = useState<MetaMaskSDK | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const MMSDK = new MetaMaskSDK({
        dappMetadata: {
          name: "ZK Whistleblower",
          url: window.location.href,
        }
      })
      setSDK(MMSDK)
    }
  }, [])

  return (
    <MetaMaskContext.Provider value={sdk}>
      {children}
    </MetaMaskContext.Provider>
  )
}

export const useMetaMask = () => useContext(MetaMaskContext) 