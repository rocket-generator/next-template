export function generateResetToken(): string {
  // Server-side only function
  if (typeof window !== "undefined") {
    throw new Error("generateResetToken can only be called on the server side");
  }
  
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require("crypto");
  return crypto.randomBytes(32).toString("hex");
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
  return typeof token === "string" && token.length === 64 && /^[a-f0-9]+$/.test(token);
}