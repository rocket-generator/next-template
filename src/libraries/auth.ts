import { AuthRepository } from "@/repositories/auth_repository";
import { SignInRequest } from "@/requests/signin_request";
import { SignUpRequest } from "@/requests/signup_request";
import type { NextAuthConfig } from "next-auth";
import NextAuth, { AuthError } from "next-auth";
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
        const repository = new AuthRepository(undefined);
        const request = {
          email: credentials.email,
          password: credentials.password,
        } as SignInRequest;
        try {
          const response = await repository.postSignIn(request);
          if (response.access_token) {
            return {
              id: response.id,
              access_token: response.access_token,
              permissions: response.permissions,
              expires_in: response.expires_in,
              token_type: response.token_type,
            };
          } else {
            return null;
          }
        } catch (error) {
          throw error;
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
        const repository = new AuthRepository(undefined);
        const request = {
          email: credentials.email,
          password: credentials.password,
          name: credentials.name,
        } as SignUpRequest;
        try {
          const response = await repository.postSignUp(request);
          console.log(response);
          if (response.access_token) {
            return {
              id: response.id,
              access_token: response.access_token,
              permissions: response.permissions,
              expires_in: response.expires_in,
              token_type: response.token_type,
            };
          } else {
            return null;
          }
        } catch (error) {
          throw error;
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
    async session({ session, token }: { session: any; token: any }) {
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
