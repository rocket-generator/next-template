import { UserRepository } from "@/repositories/user_repository";
import { PasswordResetRepository } from "@/repositories/password_reset_repository";
import { EmailVerificationRepository } from "@/repositories/email_verification_repository";
import { AuthService } from "@/services/auth_service";
import { SignInRequest } from "@/requests/signin_request";
import { SignUpRequest } from "@/requests/signup_request";
import type { NextAuthConfig } from "next-auth";
import NextAuth, { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";

export const authConfig: NextAuthConfig = {
  trustHost: true,
  secret: process.env.NEXT_AUTH_SECRET,
  providers: [
    CredentialsProvider({
      id: "prototype",
      name: "Prototype",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (
          credentials.email === "admin@example.com" &&
          credentials.password === "password"
        ) {
          return {
            id: "prototype-admin",
            email: "admin@example.com",
            password: "",
            access_token: "prototype-token",
            permissions: ["admin"],
            expires_in: 3600,
            token_type: "Bearer",
            name: "Prototype Admin",
          };
        }
        return null;
      },
    }),
    CredentialsProvider({
      id: "signin",
      name: "SignIn",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const userRepository = new UserRepository();
        const passwordResetRepository = new PasswordResetRepository();
        const emailVerificationRepository = new EmailVerificationRepository();
        const authService = new AuthService(
          userRepository,
          passwordResetRepository,
          emailVerificationRepository
        );
        const request = {
          email: credentials.email,
          password: credentials.password,
        } as SignInRequest;
        try {
          const response = await authService.signIn(request);
          if (response.access_token) {
            return {
              id: response.id,
              email: credentials.email as string,
              password: "",
              name: "",
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
        const userRepository = new UserRepository();
        const passwordResetRepository = new PasswordResetRepository();
        const emailVerificationRepository = new EmailVerificationRepository();
        const authService = new AuthService(
          userRepository,
          passwordResetRepository,
          emailVerificationRepository
        );
        const request = {
          email: credentials.email,
          password: credentials.password,
          name: credentials.name,
        } as SignUpRequest;
        try {
          const response = await authService.signUp(request);
          console.log(response);
          if (response.access_token) {
            return {
              id: response.id,
              email: credentials.email as string,
              password: "",
              name: credentials.name as string,
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
    async session({ session, token }: { session: Session; token: JWT }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          name: token.name || undefined,
          permissions: token.permissions || [],
        },
        access_token: token.access_token || undefined,
        name: token.name || undefined,
        permissions: token.permissions || [],
      };
    },
  },
};

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);
