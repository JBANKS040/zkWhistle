'use client'

import { useState, useEffect } from 'react';
import { Button, Text, HStack } from '@chakra-ui/react';
import { createWalletClient, custom, type WalletClient } from 'viem';
import { baseSepolia } from 'viem/chains';
import type { EIP1193Provider } from 'viem';

export function WalletConnect() {
  const [address, setAddress] = useState<string | null>(null);
  const [client, setClient] = useState<WalletClient | null>(null);

  useEffect(() => {
    const ethereum = window.ethereum as EIP1193Provider | undefined;
    if (typeof window !== 'undefined' && ethereum) {
      const client = createWalletClient({
        chain: baseSepolia,
        transport: custom(ethereum)
      });
      setClient(client);
    }
  }, []);

  const connectWallet = async () => {
    if (!client) return;
    
    try {
      const [address] = await client.requestAddresses();
      setAddress(address);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  return (
    <HStack spacing={4}>
      {address ? (
        <Text>
          Connected: {address.slice(0, 6)}...{address.slice(-4)}
        </Text>
      ) : (
        <Button 
          colorScheme="blue" 
          onClick={connectWallet}
          isDisabled={!client}
        >
          Connect Wallet
        </Button>
      )}
    </HStack>
  );
} 