import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const OWNER_EMAIL = process.env.OWNER_EMAIL ?? "leslie.cao5@gmail.com";
const PARTNER_EMAIL = process.env.PARTNER_EMAIL ?? "";

export type UserRole = "owner" | "partner";

export function getRole(email?: string | null): UserRole | null {
  if (!email) return null;
  if (email === OWNER_EMAIL) return "owner";
  if (PARTNER_EMAIL && email === PARTNER_EMAIL) return "partner";
  return null;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Only allow owner and partner emails
      return getRole(user.email) !== null;
    },
    async jwt({ token, account }) {
      if (account?.access_token) token.accessToken = account.access_token;
      token.role = getRole(token.email as string | undefined);
      return token;
    },
    async session({ session, token }) {
      (session as { accessToken?: string; role?: UserRole }).accessToken = token.accessToken as string | undefined;
      (session as { accessToken?: string; role?: UserRole }).role = token.role as UserRole;
      return session;
    },
  },
};
