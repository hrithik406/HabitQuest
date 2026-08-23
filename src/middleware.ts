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
     * - forgot-password (NEW!)
     * - reset-password  (NEW!)
     * - api (so your Express / NextAuth routes still work)
     * - _next/static (static files like css/js)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!login|forgot-password|reset-password|api|_next/static|_next/image|favicon.ico).*)",
  ],
};