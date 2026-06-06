import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "@/auth.config";

const googleEnabled =
  process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true" &&
  Boolean(process.env.GOOGLE_CLIENT_ID) &&
  Boolean(process.env.GOOGLE_CLIENT_SECRET);

const credentialsSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(6),
});

export const { handlers, signIn, signOut, auth, unstable_update } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers: [
    ...(googleEnabled
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            async profile(profile) {
              return {
                id: profile.sub,
                email: profile.email,
                name: profile.name,
                image: profile.picture,
                role: "LEARNER",
                onboardingDone: false,
              };
            },
          }),
        ]
      : []),
    Credentials({
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const login = parsed.data.email.trim().toLowerCase();
        const isEmail = login.includes("@");
        const user = await db.user.findFirst({
          where: isEmail ? { email: login } : { username: login },
          include: { profile: true },
        });

        if (!user || !user.passwordHash) return null;
        if (!user.isActive) return null;

        const isValid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.profile?.displayName ?? user.email,
          role: user.role,
          onboardingDone: user.profile?.onboardingDone ?? false,
        };
      },
    }),
  ],
  events: {
    async createUser({ user }) {
      // Auto-create profile for OAuth users
      if (user.id) {
        const existing = await db.userProfile.findUnique({ where: { userId: user.id } });
        if (!existing) {
          const preA1 = await db.level.findFirst({ where: { code: "PRE_A1" } });
          await db.userProfile.create({
            data: {
              userId: user.id,
              displayName: user.name ?? user.email ?? "ผู้เรียน",
              currentLevelId: preA1?.id,
              onboardingDone: false,
            },
          });
          await db.learningStreak.create({ data: { userId: user.id } });
          await db.userPreferences.create({ data: { userId: user.id } });
          await db.notificationPreference.create({ data: { userId: user.id } });
        }
      }
    },
  },
});
