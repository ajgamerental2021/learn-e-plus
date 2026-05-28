import type { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav role={session.user.role as string} />
      <main className="pb-20 md:pb-0 md:pl-56">{children}</main>
    </div>
  );
}
