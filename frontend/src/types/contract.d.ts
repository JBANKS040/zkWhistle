// JwtVerifier contract types
export type VerifierContractFunctions = {
  verifyProof: {
    inputs: [
      { name: "_pA"; type: "uint256[2]" },
      { name: "_pB"; type: "uint256[2][2]" },
      { name: "_pC"; type: "uint256[2]" },
      { name: "_pubSignals"; type: "uint256[1]" }
    ]
    outputs: [{ name: ""; type: "bool" }]
    stateMutability: "nonpayable"
  }
  getVerifiedOrganization: {
    inputs: [{ name: "user"; type: "address" }]
    outputs: [{ name: ""; type: "uint256" }]
    stateMutability: "view"
  }
  getOrganizationName: {
    inputs: [{ name: "organizationHash"; type: "uint256" }]
    outputs: [{ name: ""; type: "string" }]
    stateMutability: "view"
  }
}

// WhistleblowReport contract types
export type ReportContractFunctions = {
  submitReport: {
    inputs: [
      { name: "_title"; type: "string" },
      { name: "_content"; type: "string" }
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
  verifier: {
    inputs: []
    outputs: [{ name: ""; type: "address" }]
    stateMutability: "view"
  }
}

export type VerifierProofArgs = readonly [
  readonly [bigint, bigint], // _pA
  readonly [readonly [bigint, bigint], readonly [bigint, bigint]], // _pB
  readonly [bigint, bigint], // _pC
  readonly [bigint], // _pubSignals
] 