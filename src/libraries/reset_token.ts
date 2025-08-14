import { generateToken } from "./hash";

export async function generateResetToken(): Promise<string> {
  // Server-side only function
  if (typeof window !== "undefined") {
    throw new Error("generateResetToken can only be called on the server side");
  }

  // Use Web Crypto API compatible token generation
  return generateToken(32); // 32 bytes = 64 hex characters
}

export function isTokenExpired(expiresAt: bigint): boolean {
  const now = BigInt(Math.floor(Date.now()));
  return now > expiresAt;
}

export function createTokenExpiry(hoursFromNow: number = 24): bigint {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + hoursFromNow);
  return BigInt(expiry.getTime());
}

export function isValidToken(token: string): boolean {
  return (
    typeof token === "string" &&
    token.length === 64 &&
    /^[a-f0-9]+$/.test(token)
  );
}

/**
 * Unix TimestampをDateオブジェクトに変換
 */
export function bigIntToDate(timestamp: bigint): Date {
  return new Date(Number(timestamp));
}

/**
 * DateオブジェクトをUnix Timestampに変換
 */
export function dateToBigInt(date: Date): bigint {
  return BigInt(date.getTime());
}

/**
 * 現在時刻をUnix Timestampで取得
 */
export function getCurrentTimestamp(): bigint {
  return BigInt(Math.floor(Date.now()));
}
