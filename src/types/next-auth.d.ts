import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    access_token: string | undefined;
    user: {
      id: string | undefined;
      name: string | undefined;
      permissions: string[];
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    access_token: string | undefined;
    expires_in: number;
    token_type: string;
    name: string | undefined;
    permissions: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string | undefined;
    name: string | undefined;
    permissions: string[];
    access_token: string | undefined;
  }
}
