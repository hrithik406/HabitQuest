import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import FacebookProvider from "next-auth/providers/facebook";

const handler = NextAuth({
  providers: [
    // ── SOCIAL LOGIN PROVIDERS ──
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),

    // ── STANDARD EMAIL/USERNAME LOGIN ──
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Username", type: "text", placeholder: "player@habit.com or HeroName" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          // Using localhost as requested
          const res = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
              identifier: credentials?.identifier,
              password: credentials?.password,
            }),
            headers: { "Content-Type": "application/json" },
          });

          const data = await res.json();

          // If Express says OK, return the user to NextAuth
          if (res.ok && data.user) {
            return {
              id: data.user._id, // Map Express _id to NextAuth id
              name: data.user.username,
              email: data.user.email,
              expressToken: data.token, // Pass the Express JWT token to the session
            };
          }
          return null;
        } catch (error) {
          console.error("Credentials Login Error:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    // ── INTERCEPT & SYNC LOGINS ──
    async signIn({ user, account }) {
      // If this is a social login (Google, GitHub, Meta)
      if (account?.provider !== "credentials") {
        try {
          // Sync the social user with your Express backend
          const res = await fetch("http://localhost:5000/api/auth/oauth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              username: user.name || "Player",
              provider: account?.provider,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            // Attach the Express database ID to the NextAuth user object
            if (data.user && data.user._id) {
              user.id = data.user._id;
            }
            return true; // Allow login
          } else {
            return false; // Block login if sync fails
          }
        } catch (error) {
          console.error("Express Sync Error:", error);
          return false; 
        }
      }
      
      // Allow standard credentials login to pass through
      return true; 
    },

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
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };