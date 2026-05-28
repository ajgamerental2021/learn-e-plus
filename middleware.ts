import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;
  const role = (session?.user as any)?.role;
  const onboardingDone = (session?.user as any)?.onboardingDone;

  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isLearnerRoute =
    nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/onboarding") ||
    nextUrl.pathname.startsWith("/placement-test") ||
    nextUrl.pathname.startsWith("/learn") ||
    nextUrl.pathname.startsWith("/vocabulary") ||
    nextUrl.pathname.startsWith("/practice") ||
    nextUrl.pathname.startsWith("/homework") ||
    nextUrl.pathname.startsWith("/tests") ||
    nextUrl.pathname.startsWith("/level-exam") ||
    nextUrl.pathname.startsWith("/reports") ||
    nextUrl.pathname.startsWith("/achievements") ||
    nextUrl.pathname.startsWith("/notifications") ||
    nextUrl.pathname.startsWith("/profile") ||
    nextUrl.pathname.startsWith("/settings");

  if (isAdminRoute) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/auth/login", nextUrl));
    if (role !== "ADMIN") return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (isLearnerRoute) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/auth/login", nextUrl));
    // Redirect to onboarding if not done (except if already on /onboarding)
    if (!onboardingDone && nextUrl.pathname !== "/onboarding") {
      return NextResponse.redirect(new URL("/onboarding", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/placement-test/:path*",
    "/learn/:path*",
    "/vocabulary/:path*",
    "/practice/:path*",
    "/homework/:path*",
    "/tests/:path*",
    "/level-exam/:path*",
    "/reports/:path*",
    "/achievements/:path*",
    "/notifications/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/admin/:path*",
  ],
};
