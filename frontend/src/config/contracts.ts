export const VERIFIER_ADDRESS = process.env.NEXT_PUBLIC_VERIFIER_ADDRESS as `0x${string}`;

export const VERIFIER_CONTRACT = {
  address: VERIFIER_ADDRESS,
  abi: [
    {
      "inputs": [
        {"internalType": "uint256[2]", "name": "_pA", "type": "uint256[2]"},
        {"internalType": "uint256[2][2]", "name": "_pB", "type": "uint256[2][2]"},
        {"internalType": "uint256[2]", "name": "_pC", "type": "uint256[2]"},
        {"internalType": "uint256[1]", "name": "_pubSignals", "type": "uint256[1]"}
      ],
      "name": "verifyProof",
      "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
      "name": "getVerifiedOrganization",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "uint256", "name": "organizationHash", "type": "uint256"}],
      "name": "isOrganizationVerified",
      "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
      "stateMutability": "view",
      "type": "function"
    }
  ]
} as const;
