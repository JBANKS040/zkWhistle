// Updated contract address
export const ZKWHISTLEBLOWER_ADDRESS = '0x213966Fb4E07cA222496b104Ac73ddab2F55d318';

export const ZKWHISTLEBLOWER_CONTRACT = {
  address: ZKWHISTLEBLOWER_ADDRESS,
  abi: [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {"indexed": true, "internalType": "bytes32", "name": "proofHash", "type": "bytes32"},
        {"indexed": true, "internalType": "uint256", "name": "organizationHash", "type": "uint256"},
        {"indexed": false, "internalType": "uint256", "name": "reportHash", "type": "uint256"},
        {"indexed": true, "internalType": "address", "name": "verifier", "type": "address"}
      ],
      "name": "ProofVerified",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {"indexed": true, "internalType": "uint256", "name": "reportId", "type": "uint256"},
        {"indexed": true, "internalType": "uint256", "name": "organizationHash", "type": "uint256"},
        {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
      ],
      "name": "ReportSubmitted",
      "type": "event"
    },
    {
      "inputs": [{"internalType": "uint256", "name": "_reportId", "type": "uint256"}],
      "name": "getReport",
      "outputs": [{
        "components": [
          {"internalType": "string", "name": "title", "type": "string"},
          {"internalType": "string", "name": "content", "type": "string"},
          {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
          {"internalType": "uint256", "name": "organizationHash", "type": "uint256"}
        ],
        "internalType": "struct ZkWhistleblower.Report",
        "name": "",
        "type": "tuple"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "reportCount",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "name": "reports",
      "outputs": [
        {"internalType": "string", "name": "title", "type": "string"},
        {"internalType": "string", "name": "content", "type": "string"},
        {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
        {"internalType": "uint256", "name": "organizationHash", "type": "uint256"}
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "bool", "name": "_skip", "type": "bool"}],
      "name": "setSkipVerification",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "skipVerification",
      "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "string", "name": "_title", "type": "string"},
        {"internalType": "string", "name": "_content", "type": "string"},
        {"internalType": "uint256[2]", "name": "_pA", "type": "uint256[2]"},
        {"internalType": "uint256[2][2]", "name": "_pB", "type": "uint256[2][2]"},
        {"internalType": "uint256[2]", "name": "_pC", "type": "uint256[2]"},
        {"internalType": "uint256[2]", "name": "_pubSignals", "type": "uint256[2]"}
      ],
      "name": "submitReport",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
      "name": "verifiedProofs",
      "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
      "stateMutability": "view",
      "type": "function"
    }
  ]
} as const;

