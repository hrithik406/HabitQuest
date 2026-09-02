import { withAuth } from "next-auth/middleware";

export default withAuth({
  // Matches the pages config in [...nextauth]
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - login (your login page)
     * - forgot-password
     * - reset-password
     * - verify (🚨 NEW: Allows magic links to bypass the login wall!)
     * - api (so your Express / NextAuth routes still work)
     * - _next/static (static files like css/js)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - $ (the root/home page)
     */
    "/((?!login|forgot-password|reset-password|verify|api|_next/static|_next/image|favicon.ico|$).*)",
  ],
};