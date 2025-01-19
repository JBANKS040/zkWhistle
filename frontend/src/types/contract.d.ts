export type VerifierContractFunctions = {
  verifyProofAndStore: {
    inputs: [
      { name: "_pA"; type: "uint256[2]" },
      { name: "_pB"; type: "uint256[2][2]" },
      { name: "_pC"; type: "uint256[2]" },
      { name: "_pubSignals"; type: "uint256[1]" }
    ]
    outputs: [{ name: ""; type: "bool" }]
    stateMutability: "nonpayable"
    type: "function"
  }
}

export type VerifierProofArgs = readonly [
  readonly [bigint, bigint], // _pA
  readonly [readonly [bigint, bigint], readonly [bigint, bigint]], // _pB
  readonly [bigint, bigint], // _pC
  readonly [bigint], // _pubSignals
] 