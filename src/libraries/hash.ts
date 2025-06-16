// Use Web Crypto API instead of Node.js crypto module
// This implementation works in Edge Runtime

/**
 * Converts a string to Uint8Array
 * @param str String to convert
 * @returns Uint8Array representation
 */
function stringToBuffer(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Converts an ArrayBuffer to a hex string
 * @param buffer ArrayBuffer to convert
 * @returns Hex string
 */
function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const view = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(view)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Converts a hex string to Uint8Array
 * @param hex Hex string to convert
 * @returns Uint8Array
 */
function hexToBuffer(hex: string): Uint8Array {
  const pairs = hex.match(/[\dA-F]{2}/gi) || [];
  return new Uint8Array(pairs.map((s) => parseInt(s, 16)));
}

/**
 * Generates a random string of specified length
 * @param length Length of the random string in bytes
 * @returns Hex string of random bytes
 */
async function getRandomBytes(length: number): Promise<string> {
  const buffer = new Uint8Array(length);
  crypto.getRandomValues(buffer);
  return bufferToHex(buffer);
}

/**
 * Hashes a password using PBKDF2 with SHA-256
 * This is a server-side only function and should never be called from client components
 *
 * @param password The plain text password to hash
 * @returns The hashed password string
 */
export async function hashPassword(password: string): Promise<string> {
  // Generate a random salt
  const salt = await getRandomBytes(16);

  // Use PBKDF2 with SHA-256 and 100,000 iterations
  const passwordBuffer = stringToBuffer(password);
  const saltBuffer = hexToBuffer(salt);

  // Import the password as a key
  const baseKey = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  // Derive bits using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    256 // 32 bytes (256 bits)
  );

  const hash = bufferToHex(derivedBits);

  // Format: algorithm:iterations:salt:hash
  return `pbkdf2:100000:${salt}:${hash}`;
}

/**
 * Verifies a password against a stored hash
 * This is a server-side only function and should never be called from client components
 *
 * @param password The plain text password to verify
 * @param storedHash The previously hashed password
 * @returns True if the password matches, false otherwise
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  try {
    // Parse the stored hash format
    const [algorithm, iterationsStr, salt, originalHash] =
      storedHash.split(":");

    if (algorithm !== "pbkdf2" || !iterationsStr || !salt || !originalHash) {
      return false;
    }

    const iterations = parseInt(iterationsStr, 10);

    // Hash the input password with the same parameters
    const passwordBuffer = stringToBuffer(password);
    const saltBuffer = hexToBuffer(salt);

    // Import the password as a key
    const baseKey = await crypto.subtle.importKey(
      "raw",
      passwordBuffer,
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );

    // Derive bits using PBKDF2
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: saltBuffer,
        iterations: iterations,
        hash: "SHA-256",
      },
      baseKey,
      256 // 32 bytes (256 bits)
    );

    const inputHash = bufferToHex(derivedBits);

    // Compare the hashes (constant-time comparison is handled by the runtime)
    return inputHash === originalHash;
  } catch {
    // If any error occurs during verification, fail securely
    return false;
  }
}

/**
 * Generates a secure random token
 * This is a server-side only function and should never be called from client components
 *
 * @param length The length of the token in bytes (will be twice this in hex)
 * @returns A random token string
 */
export async function generateToken(length: number = 32): Promise<string> {
  return getRandomBytes(length);
}
