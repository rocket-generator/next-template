import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const _basePath =
  process.env.NEXT_SERVER_COMPONENT_BACKEND_API_BASE_URL ||
  process.env.NEXT_BACKEND_API_BASE_URL;

export const authConfig: NextAuthConfig = {
  trustHost: true,
  secret: process.env.NEXT_AUTH_SECRET,
  providers: [
    CredentialsProvider({
      id: "signin",
      name: "SignIn",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const authToken = await fetch(_basePath + "/auth/signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        }).then((res) => res.json());
        if (authToken && authToken.access_token) {
          return authToken;
        } else {
          return null;
        }
      },
    }),
    CredentialsProvider({
      id: "signup",
      name: "SignUp",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" },
        confirm_password: { label: "Confirm Password", type: "password" },
      },
      async authorize(credentials) {
        const authToken = await fetch(_basePath + "/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        }).then((res) => res.json());
        if (authToken && authToken.access_token) {
          return authToken;
        } else {
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/dashboard",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.access_token = user.access_token || "";
        token.name = user.name || "";
        token.permissions = user.permissions || [];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.permissions = token.permissions;
      }
      session.access_token = token.access_token;
      session.name = token.name;
      session.permissions = token.permissions;
      return session;
    },
  },
};

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);
