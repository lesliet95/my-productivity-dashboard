import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
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

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        grant_type: "refresh_token",
        refresh_token: token.refreshToken as string,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw data;

    return {
      ...token,
      accessToken: data.access_token,
      // Google only returns a new refresh_token if rotation is enabled; keep existing one otherwise
      refreshToken: data.refresh_token ?? token.refreshToken,
      accessTokenExpires: Date.now() + data.expires_in * 1000,
      error: undefined,
    };
  } catch {
    return { ...token, error: "RefreshAccessTokenError" };
  }
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
      return getRole(user.email) !== null;
    },
    async jwt({ token, account }) {
      // First sign-in: store tokens and expiry
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : Date.now() + 3600 * 1000,
          role: getRole(token.email as string | undefined),
        };
      }

      token.role = getRole(token.email as string | undefined);

      // No refresh token stored (old session) — flag for re-login
      if (!token.refreshToken) {
        return { ...token, error: "RefreshAccessTokenError" };
      }

      // Token still valid — return as-is
      if (token.accessTokenExpires && Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Token expired — refresh it
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      (session as { accessToken?: string; role?: UserRole; error?: string }).accessToken =
        token.accessToken as string | undefined;
      (session as { accessToken?: string; role?: UserRole; error?: string }).role =
        token.role as UserRole;
      (session as { accessToken?: string; role?: UserRole; error?: string }).error =
        token.error as string | undefined;
      return session;
    },
  },
};
