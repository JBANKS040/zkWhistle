export function base64ToBigInt(base64String: string): bigint {
    const binaryString = Buffer.from(base64String, 'base64');
    let result = 0n;
    for (let i = 0; i < binaryString.length; i++) {
        result = (result << 8n) + BigInt(binaryString[i]);
    }
    return result;
}

export function splitJWT(jwt: string): [string, string, string] {
    const parts = jwt.split('.');
    if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
    }
    return [parts[0], parts[1], parts[2]];
} 