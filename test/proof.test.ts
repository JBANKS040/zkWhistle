describe('JWT Circuit', () => {
  it('should verify valid JWT', async () => {
    const input = {
      message: [...jwtToArray(validJWT)],
      messageLength: validJWT.length,
      pubkey: [...rsaPubKeyToArray()],
      signature: [...signatureToArray()],
      periodIndex: validJWT.indexOf('.')
    };
    
    const witness = await circuit.calculateWitness(input);
    expect(witness[1]).to.equal(expectedOrgHash);
    expect(witness[2]).to.equal(expectedExpiry);
  });
});
