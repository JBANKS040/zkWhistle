'use client'

import { Button, Text, HStack } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { createWalletClient, custom, type EIP1193Provider } from 'viem';
import { baseSepolia } from 'viem/chains';

export function WalletConnect() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (!window?.ethereum) return;

    const walletClient = createWalletClient({
      chain: baseSepolia,
      transport: custom(window.ethereum as EIP1193Provider)
    });

    try {
      const [walletAddress] = await walletClient.getAddresses();
      setAddress(walletAddress);
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const connectWallet = async () => {
    if (!window?.ethereum) {
      alert('Please install MetaMask to connect');
      return;
    }

    setIsConnecting(true);
    const walletClient = createWalletClient({
      chain: baseSepolia,
      transport: custom(window.ethereum as EIP1193Provider)
    });

    try {
      const [walletAddress] = await walletClient.requestAddresses();
      setAddress(walletAddress);
    } catch (error) {
      console.error('Error connecting:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Button
      onClick={connectWallet}
      isLoading={isConnecting}
      colorScheme="blue"
      size="md"
      px={6}
    >
      {address ? (
        <HStack spacing={2}>
          <Text>
            {`${address.slice(0, 6)}...${address.slice(-4)}`}
          </Text>
        </HStack>
      ) : (
        'Connect Wallet'
      )}
    </Button>
  );
} 