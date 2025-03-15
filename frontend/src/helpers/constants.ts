// Match circuit parameters exactly
export const RSA_N_BITS = 121;
export const RSA_K_CHUNKS = 17;
export const MAX_MESSAGE_LENGTH = 2048;
export const MAX_B64_HEADER_LENGTH = 344;
export const MAX_B64_PAYLOAD_LENGTH = 1368;  // Must be multiple of 4
export const MAX_DOMAIN_LENGTH = 48;  // Reduced from 64 to 48 for optimization
export const MAX_PAYLOAD_LENGTH = 1026; // Updated to match JWT payload size in circuit 