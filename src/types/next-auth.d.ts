import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    access_token: string | undefined;
    user: {
      id: string | undefined;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    access_token: string | undefined;
    expire_in: number;
    token_type: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string | undefined;
    access_token: string | undefined;
  }
}
