// ZkWhistleblower contract types
export type ZkWhistleblowerContractFunctions = {
  submitReport: {
    inputs: [
      { name: "_title"; type: "string" },
      { name: "_content"; type: "string" },
      { name: "_pA"; type: "uint256[2]" },
      { name: "_pB"; type: "uint256[2][2]" },
      { name: "_pC"; type: "uint256[2]" },
      { name: "_pubSignals"; type: "uint256[2]" }
    ]
    outputs: [{ name: ""; type: "uint256" }]
    stateMutability: "nonpayable"
  }
  getReport: {
    inputs: [{ name: "_reportId"; type: "uint256" }]
    outputs: [{
      components: [
        { name: "title"; type: "string" },
        { name: "content"; type: "string" },
        { name: "timestamp"; type: "uint256" },
        { name: "organizationHash"; type: "uint256" }
      ]
      name: ""
      type: "tuple"
    }]
    stateMutability: "view"
  }
  reportCount: {
    inputs: []
    outputs: [{ name: ""; type: "uint256" }]
    stateMutability: "view"
  }
  skipVerification: {
    inputs: []
    outputs: [{ name: ""; type: "bool" }]
    stateMutability: "view"
  }
  setSkipVerification: {
    inputs: [{ name: "_skip"; type: "bool" }]
    outputs: []
    stateMutability: "nonpayable"
  }
  verifiedProofs: {
    inputs: [{ name: ""; type: "bytes32" }]
    outputs: [{ name: ""; type: "bool" }]
    stateMutability: "view"
  }
}

// Legacy types for compatibility 
export type VerifierContractFunctions = {
  // empty or redirected to new functionality
}

export type ReportContractFunctions = {
  // empty or redirected to new functionality
}

export type VerifierProofArgs = readonly [
  readonly [bigint, bigint], // _pA
  readonly [readonly [bigint, bigint], readonly [bigint, bigint]], // _pB
  readonly [bigint, bigint], // _pC
  readonly [bigint, bigint], // _pubSignals - now has 2 elements
] 