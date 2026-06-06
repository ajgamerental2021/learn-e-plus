import type { NextAuthConfig } from "next-auth";

const isProd = process.env.NODE_ENV === "production";
type AppSessionFields = { role?: string; onboardingDone?: boolean };

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  providers: [],
  cookies: {
    sessionToken: {
      name: isProd ? "__Secure-authjs.session-token" : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProd,
      },
    },
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const appUser = user as typeof user & AppSessionFields;
        token.id = user.id;
        token.role = appUser.role ?? "LEARNER";
        token.onboardingDone = appUser.onboardingDone ?? false;
      }
      if (trigger === "update" && session?.user) {
        const updatedUser = session.user as typeof session.user & AppSessionFields;
        if (typeof updatedUser.role === "string") token.role = updatedUser.role;
        if (typeof updatedUser.onboardingDone === "boolean") token.onboardingDone = updatedUser.onboardingDone;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        const sessionUser = session.user as typeof session.user & AppSessionFields;
        session.user.id = token.id as string;
        sessionUser.role = typeof token.role === "string" ? token.role : "LEARNER";
        sessionUser.onboardingDone = typeof token.onboardingDone === "boolean" ? token.onboardingDone : false;
      }
      return session;
    },
  },
};
