import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "player@habit.com" },
        password: { label: "Password", type: "password" }
      },
      // ── ⬇️ THE GLUE: NextAuth calls your Express Server here! ──
      async authorize(credentials) {
        try {
          const res = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
              email: credentials?.email,
              password: credentials?.password,
            }),
            headers: { "Content-Type": "application/json" },
          });

          const data = await res.json();

          // If Express says OK, we return the user to NextAuth!
          if (res.ok && data.user) {
            return {
              id: data.user._id, // Map Express _id to NextAuth id
              name: data.user.username,
              email: data.user.email,
              // We pass the Express JWT token so we can save it in the session!
              expressToken: data.token, 
            };
          }
          // If login fails, return null
          return null;
        } catch (error) {
          return null;
        }
      }
    })
  ],
  callbacks: {
    // 1. NextAuth creates a JWT. We inject our Express User ID and Token into it.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.expressToken = (user as any).expressToken;
      }
      return token;
    },
    // 2. NextAuth creates the Session. We pass the data to the client-side session.
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
      }
      (session as any).expressToken = token.expressToken;
      return session;
    }
  },
  pages: {
    signIn: "/login", // Tells NextAuth we will build a custom login page here!
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };