# ZK Email Reports

A decentralized application for submitting anonymous reports verified through email authentication using zero-knowledge proofs.

## Features

- Anonymous report submission with email verification
- Zero-knowledge proofs using Circom circuits
- Google OAuth integration
- On-chain report storage
- IPFS-hosted circuit artifacts

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Visit http://localhost:3000

## Local Circuit Setup

1. Install Circom (if not already installed):
```bash
npm install -g circom
```

2. Clone and build the circuits:
```bash
# From project root
cd circuits
npm install

# Download Powers of Tau file (22 powers)
mkdir -p pot
curl -o pot/powersOfTau28_hez_final_22.ptau https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_22.ptau

# Generate zkey file
snarkjs groth16 setup EmailJWT.r1cs pot/powersOfTau28_hez_final_22.ptau EmailJWT_final.zkey

# Export verification key
snarkjs zkey export verificationkey ./EmailJWT_final.zkey ./verification_key.json

# Generate Solidity verifier
snarkjs zkey export solidityverifier ./EmailJWT_final.zkey ../src/contracts/JwtGroth16Verifier.sol
```

3. Copy circuit artifacts to public directory:
```bash
mkdir -p public/circuits
cp build/EmailJWT.wasm public/circuits/
cp build/EmailJWT_final.zkey public/circuits/
```

4. Update circuit paths in your code:

```typescript:frontend/src/config/circuits.ts
export const CIRCUIT_ARTIFACTS = {
  WASM_URL: '/circuits/EmailJWT.wasm',
  ZKEY_URL: '/circuits/EmailJWT_final.zkey'
};
```

5. Deploy the contracts:
```bash
# Deploy to Base Sepolia
forge script script/DeployZkWhistleblower.s.sol:DeployZkWhistleblower --rpc-url https://sepolia.base.org --broadcast --verify
```

### Circuit Parameters

The circuit uses these parameters:
- `maxPayloadLength`: 768
- `maxDomainLength`: 32
- Message length: 2048

Make sure these match your requirements when compiling the circuit.

## Circuit Files

Circuit artifacts are hosted on IPFS:
- WASM: `bafybeifbrj6kkysc5h6ewsw7x7gaj7ie6k4ycv63ol6cen3acumlfp7odm/EmailJWT.wasm`
- ZKEY: `bafybeiabhrxz4p225vwunus5muzznwgjyof7wyv4wxgjgrailwngemz63i/EmailJWT_final.zkey`


## License

MIT
