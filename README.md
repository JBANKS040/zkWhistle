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

## Circuit Files

Circuit artifacts are hosted on IPFS:
- WASM: `bafybeifbrj6kkysc5h6ewsw7x7gaj7ie6k4ycv63ol6cen3acumlfp7odm/EmailJWT.wasm`
- ZKEY: `bafybeiabhrxz4p225vwunus5muzznwgjyof7wyv4wxgjgrailwngemz63i/EmailJWT_final.zkey`


## License

MIT
