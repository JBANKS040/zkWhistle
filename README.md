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
npm run build
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

5. Update proof generation in `frontend/src/pages/api/proxyJwtProver.ts`:
```typescript
import path from 'path';

const CIRCUIT_FILES = {
  wasm: path.join(process.cwd(), 'public/circuits/EmailJWT.wasm'),
  zkey: path.join(process.cwd(), 'public/circuits/EmailJWT_final.zkey')
};

// In your handler function:
const { proof, publicSignals } = await groth16.fullProve(
  input,
  CIRCUIT_FILES.wasm,
  CIRCUIT_FILES.zkey
);
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
