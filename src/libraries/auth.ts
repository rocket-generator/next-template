import { betterAuth } from "better-auth";
import { toNextJsHandler, nextCookies } from "better-auth/next-js";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { headers as nextHeaders } from "next/headers";

import { prisma } from "@/libraries/prisma";
import { hashPassword, verifyPassword } from "@/libraries/hash";
import type { AppSession } from "@/types/auth";

type HeadersLike = HeadersInit | Headers;

const baseURL =
  process.env.BETTER_AUTH_BASE_URL ??
  process.env.APP_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://localhost:3000";

const secret = process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET;

if (!secret) {
  throw new Error(
    "Missing Better Auth secret. Please set BETTER_AUTH_SECRET (or AUTH_SECRET) in your environment."
  );
}

const authInstance = betterAuth({
  baseURL,
  secret,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
    transaction: true,
    usePlural: false,
  }),
  plugins: [nextCookies()],
  session: {
    modelName: "session",
    fields: {
      userId: "userId",
      expiresAt: "expiresAt",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      ipAddress: "ipAddress",
      userAgent: "userAgent",
      token: "token",
    },
    additionalFields: {
      accessToken: {
        type: "string",
        fieldName: "accessToken",
        required: false,
        returned: true,
        input: false,
      },
      permissions: {
        type: "json",
        fieldName: "permissions",
        required: false,
        returned: true,
        input: false,
        defaultValue: () => [],
      },
    },
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
    storeSessionInDatabase: true,
    preserveSessionInDatabase: true,
    expiresIn: 60 * 60 * 24,
    updateAge: 60 * 60 * 4,
  },
  user: {
    modelName: "user",
    fields: {
      emailVerified: "emailVerified",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      image: "avatarKey",
    },
    additionalFields: {
      password: {
        type: "string",
        fieldName: "password",
        returned: false,
      },
      permissions: {
        type: "json",
        fieldName: "permissions",
        defaultValue: () => [],
      },
      isActive: {
        type: "boolean",
        fieldName: "isActive",
        defaultValue: true,
      },
      language: {
        type: "string",
        fieldName: "language",
        defaultValue: "",
        required: false,
      },
    },
  },
  account: {
    modelName: "account",
    fields: {
      userId: "userId",
      providerId: "providerId",
      accountId: "accountId",
      accessToken: "accessToken",
      refreshToken: "refreshToken",
      accessTokenExpiresAt: "accessTokenExpiresAt",
      refreshTokenExpiresAt: "refreshTokenExpiresAt",
      idToken: "idToken",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      scope: "scope",
      password: "password",
    },
  },
  verification: {
    modelName: "verifications",
    fields: {
      value: "token",
      expiresAt: "expiresAt",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    requireEmailVerification: process.env.ENABLE_EMAIL_VERIFICATION === "true",
    autoSignIn: true,
    password: {
      hash: hashPassword,
      verify: async ({ hash, password }) => verifyPassword(password, hash),
    },
  },
});

const handlerSet = toNextJsHandler(authInstance);

async function buildHeaders(headersInit?: HeadersLike): Promise<Headers> {
  if (headersInit) {
    return new Headers(headersInit);
  }

  try {
    const incoming = await nextHeaders();
    const prepared = new Headers();
    for (const [key, value] of incoming.entries()) {
      prepared.append(key, value);
    }
    return prepared;
  } catch {
    return new Headers();
  }
}

type GetSessionOptions = {
  headers?: HeadersLike;
  disableCookieCache?: boolean;
  disableRefresh?: boolean;
};

type LegacySession = AppSession & {
  access_token?: string;
  permissions: string[];
  name?: string;
};

export async function auth(
  options: GetSessionOptions = {}
): Promise<LegacySession | null> {
  const headers = await buildHeaders(options.headers);
  const query: Record<string, boolean> = {};
  if (typeof options.disableCookieCache === "boolean") {
    query.disableCookieCache = options.disableCookieCache;
  }
  if (typeof options.disableRefresh === "boolean") {
    query.disableRefresh = options.disableRefresh;
  }

  const result = await authInstance.api.getSession({
    headers,
    query: Object.keys(query).length ? query : undefined,
  });

  if (!result) {
    return null;
  }

  const sessionPermissions = Array.isArray(
    (result.session as Record<string, unknown>).permissions
  )
    ? ((result.session as Record<string, unknown>).permissions as string[])
    : [];

  const userPermissions = Array.isArray(
    (result.user as Record<string, unknown>).permissions
  )
    ? ((result.user as Record<string, unknown>).permissions as string[])
    : [];

  const combinedPermissions = Array.from(
    new Set([...sessionPermissions, ...userPermissions])
  );

  const accessToken = (result.session as Record<string, unknown>)
    .accessToken as string | undefined;

  const normalized: AppSession = {
    user: {
      id: result.user.id,
      email: result.user.email ?? undefined,
      name: result.user.name ?? undefined,
      permissions: combinedPermissions,
    },
    accessToken,
    expiresAt: result.session.expiresAt,
    sessionToken: result.session.token,
  };

  return {
    ...normalized,
    access_token: accessToken,
    permissions: combinedPermissions,
    name: normalized.user?.name,
  };
}

type SignInErrorCode =
  | "invalid_credentials"
  | "email_not_verified"
  | "configuration"
  | "unknown";

type SignInOptions = EstablishSessionOptions;

type SignInResult =
  | { success: true; session: AppSession }
  | { success: false; reason: SignInErrorCode; error?: unknown };

async function normalizeSignInError(error: unknown): Promise<SignInErrorCode> {
  const inspect = async (value: unknown): Promise<string> => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      const maybe = value as Record<string, unknown>;
      if (typeof maybe.message === "string") return maybe.message;
      if (typeof maybe.error === "string") return maybe.error;
    }
    return "";
  };

  try {
    if (typeof Response !== "undefined" && error instanceof Response) {
      try {
        const data = await error.clone().json();
        const message = await inspect(data);
        if (message) return mapErrorMessage(message);
      } catch {
        const text = await error.text();
        if (text) return mapErrorMessage(text);
      }
    }
  } catch {
    // ignore parsing errors
  }

  if (error && typeof error === "object") {
    const maybe = error as Record<string, unknown>;
    const candidates: string[] = [];
    if (typeof maybe.message === "string") candidates.push(maybe.message);
    if (typeof maybe.code === "string") candidates.push(maybe.code);
    if (typeof maybe.status === "string") candidates.push(maybe.status);
    const combined = candidates.join(" ");
    if (combined) {
      return mapErrorMessage(combined);
    }
  }

  if (typeof error === "string") {
    return mapErrorMessage(error);
  }

  return "unknown";
}

function mapErrorMessage(message: string): SignInErrorCode {
  const upper = message.toUpperCase();
  if (
    upper.includes("INVALID_EMAIL_OR_PASSWORD") ||
    upper.includes("INVALID CREDENTIAL") ||
    upper.includes("INVALID PASSWORD")
  ) {
    return "invalid_credentials";
  }
  if (upper.includes("EMAIL_NOT_VERIFIED")) {
    return "email_not_verified";
  }
  if (upper.includes("EMAIL AND PASSWORD IS NOT ENABLED")) {
    return "configuration";
  }
  if (
    upper.includes("FAILED_TO_GET_SESSION") ||
    upper.includes("SESSION_NOT_FOUND") ||
    upper.includes("USER_NOT_FOUND")
  ) {
    return "configuration";
  }
  return "unknown";
}

async function logSignInError(error: unknown) {
  try {
    if (typeof Response !== "undefined" && error instanceof Response) {
      const cloned = error.clone();
      let payload: unknown = null;
      try {
        payload = await cloned.json();
      } catch {
        try {
          payload = await cloned.text();
        } catch {
          payload = "[unreadable response]";
        }
      }
      console.error("[better-auth] signIn Response error", {
        status: error.status,
        statusText: error.statusText,
        payload,
      });
      return;
    }

    if (error instanceof Error) {
      console.error("[better-auth] signIn Error instance", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      return;
    }

    console.error("[better-auth] signIn unknown error", error);
  } catch (loggingError) {
    console.error("[better-auth] failed to log signIn error", loggingError);
  }
}

export async function signIn(options: SignInOptions): Promise<SignInResult> {
  try {
    const session = await establishSession(options);
    if (!session) {
      return { success: false, reason: "invalid_credentials" };
    }
    return { success: true, session };
  } catch (error) {
    await logSignInError(error);
    const reason = await normalizeSignInError(error);
    return { success: false, reason, error };
  }
}

export async function signOut(options: { headers?: HeadersLike } = {}) {
  const headers = await buildHeaders(options.headers);
  await authInstance.api.signOut({ headers });
}

export async function getAuthContext() {
  return authInstance.$context;
}

export const handlers = handlerSet;
export const betterAuthHandler = authInstance;

type EstablishSessionOptions = {
  email: string;
  password: string;
  rememberMe?: boolean;
  accessToken?: string;
  permissions?: string[];
  headers?: HeadersLike;
};

export async function syncCredentialAccount(params: {
  userId: string;
  email: string;
  passwordHash: string;
}) {
  const { userId, email, passwordHash } = params;

  await prisma.account.upsert({
    where: {
      providerId_accountId: {
        providerId: "credential",
        accountId: email,
      },
    },
    update: {
      password: passwordHash,
      userId,
    },
    create: {
      userId,
      providerId: "credential",
      accountId: email,
      password: passwordHash,
    },
  });

  const credentialAccount = await prisma.account.findUnique({
    where: {
      providerId_accountId: {
        providerId: "credential",
        accountId: email,
      },
    },
    select: {
      userId: true,
      providerId: true,
      accountId: true,
      password: true,
      updatedAt: true,
    },
  });

  console.debug("[better-auth] syncCredentialAccount", {
    userId,
    email,
    accountFound: Boolean(credentialAccount),
    passwordPresent: typeof credentialAccount?.password === "string",
    lastUpdatedAt: credentialAccount?.updatedAt,
  });
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

async function findSessionByToken(
  token: string,
  attempts: number = 3,
  delayMs: number = 50
) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const session = await prisma.session.findUnique({
      where: { token },
    });
    if (session) {
      return session;
    }
    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return null;
}

export async function establishSession(
  options: EstablishSessionOptions
): Promise<AppSession | null> {
  const headers = await buildHeaders(options.headers);

  const signInResponse = await authInstance.api.signInEmail({
    headers,
    body: {
      email: options.email,
      password: options.password,
      rememberMe: options.rememberMe ?? true,
    },
  });

  const sessionToken = signInResponse?.token;
  if (!sessionToken) {
    console.warn("[better-auth] signInEmail response missing token", {
      userId: signInResponse?.user?.id,
      email: options.email,
    });
    throw new Error("FAILED_TO_GET_SESSION");
  }

  const sessionRecord = await findSessionByToken(sessionToken);
  if (!sessionRecord) {
    console.warn("[better-auth] session not found after signInEmail", {
      token: sessionToken,
      userId: signInResponse?.user?.id,
    });
    throw new Error("SESSION_NOT_FOUND");
  }

  const userRecord = await prisma.user.findUnique({
    where: { id: sessionRecord.userId },
    select: {
      id: true,
      email: true,
      name: true,
      permissions: true,
    },
  });

  if (!userRecord) {
    console.warn("[better-auth] user not found for session", {
      userId: sessionRecord.userId,
      token: sessionToken,
    });
    throw new Error("USER_NOT_FOUND");
  }

  const sessionPermissions = normalizeStringArray(options.permissions ?? []);
  const userPermissions = normalizeStringArray(userRecord.permissions);
  const combinedPermissions = Array.from(
    new Set([...sessionPermissions, ...userPermissions])
  );

  const session: AppSession = {
    user: {
      id: userRecord.id,
      email: userRecord.email ?? undefined,
      name: userRecord.name ?? undefined,
      permissions: combinedPermissions,
    },
    accessToken: options.accessToken ?? sessionRecord.accessToken ?? undefined,
    expiresAt: sessionRecord.expiresAt,
    sessionToken: sessionRecord.token,
  };

  try {
    await prisma.session.update({
      where: { token: sessionRecord.token },
      data: {
        accessToken: options.accessToken ?? null,
        permissions: sessionPermissions,
      },
    });
  } catch (error) {
    console.error("Failed to persist session metadata", error);
  }

  return session;
}
