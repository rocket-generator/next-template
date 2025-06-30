import { generateToken } from "./hash";

export async function generateResetToken(): Promise<string> {
  // Server-side only function
  if (typeof window !== "undefined") {
    throw new Error("generateResetToken can only be called on the server side");
  }

  // Use Web Crypto API compatible token generation
  return generateToken(32); // 32 bytes = 64 hex characters
}

export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

export function createTokenExpiry(hoursFromNow: number = 24): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + hoursFromNow);
  return expiry;
}

export function isValidToken(token: string): boolean {
  return (
    typeof token === "string" &&
    token.length === 64 &&
    /^[a-f0-9]+$/.test(token)
  );
}
