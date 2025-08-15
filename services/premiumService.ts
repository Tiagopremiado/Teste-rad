
// This service acts as a local "database" of premium activation codes.
// In a real-world application, this would be a call to a secure backend server.

interface CodeMap {
    [code: string]: number; // code: duration in days (Infinity for lifetime)
}

// "Pre-generated" codes for different subscription tiers.
// For a real app, these should be securely generated and managed server-side.
const CODES: CodeMap = {
    // 7-Day Access Codes
    'W7N-A4X-K2C': 7,
    'P3R-S8V-B5M': 7,
    'F9Z-Q1J-T6G': 7,
    'H2L-C7W-Y4N': 7,
    'V5K-M8P-R3D': 7,

    // 15-Day Access Codes
    'X15-G9B-E4H': 15,
    'T2K-L6F-C8V': 15,
    'M7J-R1S-P9N': 15,
    'A3D-W5X-Q2Z': 15,
    'Y8B-H4G-V6K': 15,

    // 30-Day Access Codes
    'C30-V7M-S2P': 30,
    'L1R-K9N-F4J': 30,
    'E6G-D3H-T8B': 30,
    'Z5X-A7W-Q1S': 30,
    'P2M-Y4C-V9L': 30,

    // Lifetime Access Code
    'VIP-LIFE-4EVER': Infinity,
    'ELITE-RADAR-MAX': Infinity,

    // Admin Code
    '84081447': Infinity,
};

/**
 * Validates an activation code and returns its duration.
 * @param code The activation code entered by the user.
 * @returns The duration in days (or Infinity for lifetime), or null if the code is invalid.
 */
export const getCodeDuration = (code: string): number | null => {
    const normalizedCode = code.toUpperCase().trim();
    return CODES[normalizedCode] || null;
};
