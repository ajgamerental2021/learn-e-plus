import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import ProfileClient from "@/components/profile/ProfileClient";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const [user, profile, streak, skillScores, lessonsDone, testsDone] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, createdAt: true, role: true, notificationPrefs: true },
    }),
    db.userProfile.findUnique({
      where: { userId: session.user.id },
      include: { currentLevel: { select: { code: true, nameTh: true } } },
    }),
    db.learningStreak.findUnique({
      where: { userId: session.user.id },
      select: { currentStreak: true, longestStreak: true },
    }),
    db.skillScore.findMany({ where: { userId: session.user.id } }),
    db.userLessonProgress.count({ where: { userId: session.user.id, status: "COMPLETED" } }),
    db.testAttempt.count({ where: { userId: session.user.id } }),
  ]);

  if (!user) redirect("/auth/login");

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <ProfileClient
        user={{ ...user, displayName: profile?.displayName ?? null }}
        profile={profile as never}
        streak={streak ?? null}
        skillScores={skillScores}
        lessonsCompleted={lessonsDone}
        testsAttempted={testsDone}
      />
    </div>
  );
}
