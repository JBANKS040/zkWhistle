# Project Overview
The project is called **zkWhistle**, and it is deployed on the Ethereum blockchain. It allows individuals to anonymously report unethical business practices while proving their affiliation with an organization leveraging zero-knowledge proofs.

### **Technologies Used**:
- **Blockchain**: Ethereum
- **Languages**: Solidity, Rust, TypeScript
- **Tools**: Circom, SnarkJS, Just, npm, Foundry
- **Libraries**: OpenZeppelin, Zk-Email
- **Proof System**: Groth16

---

# Core Functionalities

## 1. Prove Affiliation with Organization
### **Objective**:
Allow any user to prove their affiliation with an organization using zero-knowledge proofs (ZKPs) and a JSON Web Token (JWT).

### **Steps**:
1. **User Authentication**:
   - The user connects an **Externally Owned Account (EOA)** (e.g., MetaMask).
   - The user provides a valid **JWT** that contains the following claims:
     - **iss**: Issuer (who issued the token).
     - **sub**: Subject (the user the token refers to).
     - **aud**: Audience (who the token is intended for).
     - **exp**: Expiration time (Unix timestamp).
     - **nbf**: Not Before (when the token becomes valid).
     - **iat**: Issued At (when the token was issued).
     - **jti**: Unique ID of the token.
     - **Custom Claims**:
       - **user_id**: Unique user ID.
       - **email**: User's email.
       - **name**: User's full name.
       - **role**: User's role (e.g., admin).
       - **organization**: Organization name.
       - **custom_permission**: Application-specific permissions.

   **JWT Example**:
   ```json
   {
     "iss": "auth.example.com",
     "sub": "1234567890",
     "aud": "api.example.com",
     "exp": 1716741600,
     "nbf": 1716738000,
     "iat": 1716738000,
     "jti": "unique-token-id",
     "user_id": "1234567890",
     "email": "johndoe@gmail.com",
     "name": "John Doe",
     "role": "admin",
     "organization": "Acme Corp",
     "custom_permission": "full_access"
   }
   ```

2. **Proof Generation**:
   - The JWT is used to generate a **zkSNARK-proof** using:
     - **Zk-Email**
     - **Circom**
     - **SnarkJS**
     - **Groth16** (proof system)
   - The zk-proof is generated **on the client side**.

3. **On-Chain Verification**:
   - The zk-proof is submitted to a **smart contract** for verification.
   - Once verified, the user is granted permission to submit a whistleblowing report.

---

## 2. Submit Whistleblower Reports
### **Objective**:
Allow verified users to submit whistleblowing reports with confidentiality.

### **Steps**:
1. **Access Submit Interface**:
   - After proof verification, a **SUBMIT** button appears.
   - The submit interface contains a **predefined, unchangeable field**:
     - **Organization** (auto-filled from the JWT).

2. **Input Fields**:
   - **Title**: Short title of the report (required).
   - **Content**: Detailed description of the report (required).

3. **File Upload**:
   - Users can upload PDF files as evidence.
   - The process for handling PDFs:
     - Upload the PDF to **IPFS** (InterPlanetary File System).
     - Generate a **SHA-256 hash** of the file.
     - Store the hash on-chain to ensure integrity.
     - Optionally, generate a **ZK-proof** to verify the PDF's authenticity without exposing its contents.

4. **Report Storage**:
   - PDFs are stored **off-chain** on IPFS.
   - On-chain storage includes:
     - PDF hash (SHA-256)
     - ZK-proof (optional)
     - Metadata: title, content, and organization.

---



---

# Notes for Developers
- Ensure **client-side proof generation** is implemented securely.
- Use **IPFS** for PDF storage and store only hashes on-chain.
- Follow the Zk-Email documentation for JWT-based proof generation.
- Smart contracts should verify proofs efficiently and securely.
- Implement expiry checks during proof verification to ensure system integrity.
