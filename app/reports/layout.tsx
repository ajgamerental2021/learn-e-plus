import type { ReactNode } from "react";
import LearnerNav from "@/components/layout/LearnerNav";

export default function ReportsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <LearnerNav />
      <main className="pb-20 md:pb-0 md:pl-56">{children}</main>
    </div>
  );
}
