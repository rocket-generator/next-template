import { createAuthClient } from "better-auth/react";

const clientBaseURL =
  process.env.NEXT_PUBLIC_BETTER_AUTH_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  undefined;

const clientBasePath =
  process.env.NEXT_PUBLIC_BETTER_AUTH_BASE_PATH ?? "/api/auth";

export const authClient = createAuthClient({
  baseURL: clientBaseURL,
  basePath: clientBasePath,
  fetchOptions: {
    credentials: "include",
    headers: {
      "X-Requested-With": "XMLHttpRequest",
    },
  },
});

export const signIn = authClient.signIn;
export const signOut = authClient.signOut;
export const useSession = authClient.useSession;
export const authFetch = authClient.$fetch;
