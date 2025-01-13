/**
 * Converts a base64 string to a BigInt
 * @param base64String The base64 string to convert
 * @returns The BigInt representation
 */
export function base64ToBigInt(base64String: string): bigint {
  const buffer = Buffer.from(base64String, 'base64');
  const hex = buffer.toString('hex');
  return BigInt('0x' + hex);
}

/**
 * Splits a JWT string into its components
 * @param jwt The JWT string
 * @returns Array of [header, payload, signature] in base64
 */
export function splitJWT(jwt: string): [string, string, string] {
  const parts = jwt.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format: Missing components');
  }
  return [parts[0], parts[1], parts[2]];
}

/**
 * Converts a bigint to a fixed-length hex string
 * @param value The bigint to convert
 * @param length The desired length of the hex string
 * @returns Padded hex string
 */
export function bigintToHex(value: bigint, length: number): string {
  return value.toString(16).padStart(length * 2, '0');
}

/**
 * Pads an array to a specific length with a fill value
 * @param arr The array to pad
 * @param length The desired length
 * @param padValue The value to pad with
 * @returns Padded array
 */
export function padArray<T>(arr: T[], length: number, padValue: T | null = null): T[] {
  // If array is too long, truncate it
  const workingArray = arr.length > length ? arr.slice(0, length) : arr;
  
  // Then pad if needed
  return [...workingArray, ...Array(length - workingArray.length).fill(padValue)];
} 