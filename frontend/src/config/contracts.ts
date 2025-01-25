// Update contract addresses
export const VERIFIER_ADDRESS = '0x9e4394caC3b4F3Ebcd7cB32d4Fd7F55B8D2a8B25';
export const REPORT_ADDRESS = '0xc35570465a0EE1939C012070B2B762be02e48290';

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
    },
    {
      "inputs": [{"internalType": "uint256", "name": "organizationHash", "type": "uint256"}],
      "name": "getOrganizationName",
      "outputs": [{"internalType": "string", "name": "", "type": "string"}],
      "stateMutability": "view",
      "type": "function"
    }
  ]
} as const;

export const REPORT_CONTRACT = {
  address: REPORT_ADDRESS,
  abi: [
    {
      "inputs": [{"internalType": "address", "name": "_verifier", "type": "address"}],
      "stateMutability": "nonpayable",
      "type": "constructor"
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
      "inputs": [
        {"internalType": "string", "name": "_title", "type": "string"},
        {"internalType": "string", "name": "_content", "type": "string"}
      ],
      "name": "submitReport",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "nonpayable",
      "type": "function"
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
        "internalType": "struct WhistleblowReport.Report",
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
      "inputs": [],
      "name": "verifier",
      "outputs": [{"internalType": "contract JwtVerifier", "name": "", "type": "address"}],
      "stateMutability": "view",
      "type": "function"
    }
  ]
} as const;
