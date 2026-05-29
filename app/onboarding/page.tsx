import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const profile = await db.userProfile.findUnique({
    where: { userId: session.user.id },
    select: { onboardingDone: true, displayName: true },
  });

  if (profile?.onboardingDone) redirect("/dashboard");

  return (
    <div style={{ padding: 40 }}>
      <h1>Onboarding - {profile?.displayName}</h1>
      <OnboardingWizard displayName={profile?.displayName ?? "คุณ"} />
    </div>
  );
}
