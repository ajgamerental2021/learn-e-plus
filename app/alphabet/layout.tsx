import type { ReactNode } from "react";
import LearnerNav from "@/components/layout/LearnerNav";
import { auth } from "@/lib/auth";

export default async function AlphabetLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;

  return (
    <div className="min-h-screen bg-gray-50">
      <LearnerNav role={role} />
      <main className="pb-20 md:pb-0 md:pl-56">{children}</main>
    </div>
  );
}
