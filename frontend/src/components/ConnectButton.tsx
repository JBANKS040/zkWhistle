'use client'

import { useConnect } from 'wagmi'

export function ConnectButton() {
  const { connect, connectors, status } = useConnect()

  return (
    <div>
      {connectors.map((connector) => (
        <button
          key={connector.id}
          onClick={() => connect({ connector })}
          disabled={status === 'pending'}
        >
          {connector.name}
          {status === 'pending' && ' (connecting)'}
        </button>
      ))}
    </div>
  )
} 