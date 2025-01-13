import { WhistleblowerContractFunctions } from '@/types/contract'

export const WHISTLEBLOWER_ADDRESS = "0x9ef375a43de671fcd09b9f8cf202c9a0f85a2742"

export const WHISTLEBLOWER_CONTRACT = {
  address: WHISTLEBLOWER_ADDRESS as `0x${string}`,
  abi: [
    {
      "type": "constructor",
      "inputs": [{"name": "_verifierAddress", "type": "address", "internalType": "address"}],
      "stateMutability": "nonpayable"
    },
    {
      "type": "event",
      "name": "ReportSubmitted",
      "inputs": [
        {"name": "organizationHash", "type": "uint256", "indexed": true, "internalType": "uint256"},
        {"name": "reportHash", "type": "bytes32", "indexed": false, "internalType": "bytes32"},
        {"name": "timestamp", "type": "uint256", "indexed": false, "internalType": "uint256"},
        {"name": "ipfsHash", "type": "string", "indexed": false, "internalType": "string"}
      ],
      "anonymous": false
    },
    {
      "type": "function",
      "name": "getReportCount",
      "inputs": [{"name": "organizationHash", "type": "uint256", "internalType": "uint256"}],
      "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getReports",
      "inputs": [{"name": "organizationHash", "type": "uint256", "internalType": "uint256"}],
      "outputs": [{
        "name": "",
        "type": "tuple[]",
        "internalType": "struct Whistleblower.Report[]",
        "components": [
          {"name": "reportHash", "type": "bytes32", "internalType": "bytes32"},
          {"name": "timestamp", "type": "uint256", "internalType": "uint256"},
          {"name": "encryptedData", "type": "bytes", "internalType": "bytes"},
          {"name": "title", "type": "string", "internalType": "string"},
          {"name": "content", "type": "string", "internalType": "string"},
          {"name": "ipfsHash", "type": "string", "internalType": "string"}
        ]
      }],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "reports",
      "inputs": [
        {"name": "", "type": "uint256", "internalType": "uint256"},
        {"name": "", "type": "uint256", "internalType": "uint256"}
      ],
      "outputs": [
        {"name": "reportHash", "type": "bytes32", "internalType": "bytes32"},
        {"name": "timestamp", "type": "uint256", "internalType": "uint256"},
        {"name": "encryptedData", "type": "bytes", "internalType": "bytes"},
        {"name": "title", "type": "string", "internalType": "string"},
        {"name": "content", "type": "string", "internalType": "string"},
        {"name": "ipfsHash", "type": "string", "internalType": "string"}
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "submitReport",
      "inputs": [
        {"name": "_pA", "type": "uint256[2]", "internalType": "uint256[2]"},
        {"name": "_pB", "type": "uint256[2][2]", "internalType": "uint256[2][2]"},
        {"name": "_pC", "type": "uint256[2]", "internalType": "uint256[2]"},
        {"name": "_pubSignals", "type": "uint256[2]", "internalType": "uint256[2]"},
        {"name": "_encryptedData", "type": "bytes", "internalType": "bytes"}
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "submitReportWithIPFS",
      "inputs": [
        {"name": "_pA", "type": "uint256[2]", "internalType": "uint256[2]"},
        {"name": "_pB", "type": "uint256[2][2]", "internalType": "uint256[2][2]"},
        {"name": "_pC", "type": "uint256[2]", "internalType": "uint256[2]"},
        {"name": "_pubSignals", "type": "uint256[2]", "internalType": "uint256[2]"},
        {"name": "_encryptedData", "type": "bytes", "internalType": "bytes"},
        {"name": "_title", "type": "string", "internalType": "string"},
        {"name": "_content", "type": "string", "internalType": "string"},
        {"name": "_ipfsHash", "type": "string", "internalType": "string"}
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "verifier",
      "inputs": [],
      "outputs": [{"name": "", "type": "address", "internalType": "contract Groth16Verifier"}],
      "stateMutability": "view"
    }
  ] as const,
} as const

export type WhistleblowerContract = typeof WHISTLEBLOWER_CONTRACT & {
  abi: WhistleblowerContractFunctions[]
}