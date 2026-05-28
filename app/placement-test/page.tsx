import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import PlacementTest from "@/components/placement-test/PlacementTest";

export default async function PlacementTestPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  // Already has result → show result
  const existing = await db.placementTestResult.findUnique({
    where: { userId: session.user.id },
  });
  if (existing) redirect("/placement-test/result");

  return <PlacementTest />;
}
