export type WhistleblowerContractFunctions = {
  submitReport: {
    inputs: [
      { name: "_pA"; type: "uint256[2]" },
      { name: "_pB"; type: "uint256[2][2]" },
      { name: "_pC"; type: "uint256[2]" },
      { name: "_publicSignals"; type: "uint256[2]" }
    ]
    name: "submitReport"
    outputs: []
    stateMutability: "nonpayable"
    type: "function"
  }
}

export type WhistleblowerProofArgs = readonly [
  readonly [bigint, bigint], // _pA
  readonly [readonly [bigint, bigint], readonly [bigint, bigint]], // _pB
  readonly [bigint, bigint], // _pC
  readonly [bigint, bigint], // _publicSignals
] 