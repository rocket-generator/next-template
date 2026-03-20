import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies, toNextJsHandler } from "better-auth/next-js";
import { headers as nextHeaders } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { createEmailServiceInstance } from "@/libraries/email";
import { hashPassword, verifyPassword } from "@/libraries/hash";
import { prisma } from "@/libraries/prisma";
import type { AppSession } from "@/types/auth";

type HeadersLike = HeadersInit | Headers;

const baseURL =
  process.env.BETTER_AUTH_BASE_URL ??
  process.env.APP_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://localhost:3000";

const secret = process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET;
const emailVerificationEnabled =
  process.env.ENABLE_EMAIL_VERIFICATION === "true";

if (!secret) {
  throw new Error(
    "Missing Better Auth secret. Please set BETTER_AUTH_SECRET (or AUTH_SECRET) in your environment."
  );
}

function buildAppUrl(pathname: string): string {
  return new URL(pathname, baseURL).toString();
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
    changeEmail: {
      enabled: true,
      updateEmailWithoutVerification: true,
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
    modelName: "verification",
    fields: {
      value: "token",
      expiresAt: "expiresAt",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
    requireEmailVerification: emailVerificationEnabled,
    autoSignIn: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, token }) => {
      const emailService = createEmailServiceInstance();
      await emailService.sendPasswordResetEmail(
        user.email,
        buildAppUrl(`/reset-password?token=${encodeURIComponent(token)}`)
      );
    },
    password: {
      hash: hashPassword,
      verify: async ({ hash, password }) => verifyPassword(password, hash),
    },
  },
  ...(emailVerificationEnabled
    ? {
        emailVerification: {
          sendOnSignUp: true,
          expiresIn: 60 * 60,
          sendVerificationEmail: async ({
            user,
            token,
          }: {
            user: { email: string };
            token: string;
          }) => {
            const emailService = createEmailServiceInstance();
            await emailService.sendVerificationEmail(
              user.email,
              buildAppUrl(`/verify-email?token=${encodeURIComponent(token)}`)
            );
          },
        },
      }
    : {}),
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

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

type GetSessionOptions = {
  headers?: HeadersLike;
  disableCookieCache?: boolean;
  disableRefresh?: boolean;
};

export async function auth(
  options: GetSessionOptions = {}
): Promise<AppSession | null> {
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
    query: Object.keys(query).length > 0 ? query : undefined,
  });

  if (!result) {
    return null;
  }

  const user = result.user as Record<string, unknown>;

  return {
    user: {
      id: result.user.id,
      email: result.user.email ?? undefined,
      name: result.user.name ?? undefined,
      permissions: normalizeStringArray(user.permissions),
    },
    expiresAt: result.session.expiresAt,
  };
}

export async function signOut(options: { headers?: HeadersLike } = {}) {
  const headers = await buildHeaders(options.headers);
  await authInstance.api.signOut({ headers });
}

export async function requireAuthSession() {
  const session = await auth({ disableRefresh: true });

  if (!session?.user?.id) {
    redirect("/signin");
  }

  return session as AppSession & { user: NonNullable<AppSession["user"]> };
}

export async function requireAdminSession() {
  const session = await requireAuthSession();

  if (!session.user?.permissions.includes("admin")) {
    notFound();
  }

  return session;
}

export const handlers = handlerSet;
export const betterAuthHandler = authInstance;
export { buildAppUrl, buildHeaders };
