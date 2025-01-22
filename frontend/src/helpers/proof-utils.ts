import axios from 'axios'

export async function generateProof(jwt: string) {
  try {
    // First call - generate circuit inputs
    console.log('Step 1: Calling generateCircuitInputs with JWT:', jwt.slice(0, 20) + '...');
    
    const inputsResponse = await axios.post('/api/generateCircuitInputs', { 
      jwt 
    });
    
    if (!inputsResponse.data) {
      throw new Error('No data received from generateCircuitInputs');
    }
    
    console.log('Circuit inputs generated:', {
      messageLength: inputsResponse.data.message?.length,
      pubkeyLength: inputsResponse.data.pubkey?.length,
      signatureLength: inputsResponse.data.signature?.length
    });

    // Extract domain from JWT payload
    const payload = jwt.split('.')[1];
    const decodedPayload = JSON.parse(atob(payload));
    const email = decodedPayload.email;
    const domain = email.split('@')[1]; // This will give us "gmail.com"
    
    // Second call - generate proof
    console.log('Step 2: Calling proxyJwtProver with inputs');
    const proverResponse = await axios.post('/api/proxyJwtProver', {
      input: inputsResponse.data
    });

    if (!proverResponse.data?.proof || !proverResponse.data?.publicSignals) {
      throw new Error('Invalid proof response from proxyJwtProver');
    }

    // Add the extracted domain to the response
    const proofData = {
      ...proverResponse.data,
      publicSignals: {
        ...proverResponse.data.publicSignals,
        organization_name: domain
      }
    };

    console.log('Step 3: Proof generated successfully:', {
      proof: 'Generated',
      publicSignals: proverResponse.data.publicSignals
    });

    console.log('Proof response:', {
      proof: proverResponse.data.proof,
      publicSignals: proverResponse.data.publicSignals,
      organizationName: proverResponse.data.publicSignals.organization_name
    });

    console.log('JWT Proof Generation:', {
      inputData: inputsResponse.data,
      proofResponse: proverResponse.data,
      publicSignals: {
        organization_hash: proverResponse.data.publicSignals.organization_hash,
        organization_name: proverResponse.data.publicSignals.organization_name
      }
    });

    return proofData;
  } catch (error: any) {
    console.error('Proof generation error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw new Error(error.response?.data?.error || error.message);
  }
}