import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";

// Validate required environment variables
const validateAuthConfig = () => {
  const secret = process.env.AUTH_SECRET;
  const url = process.env.NEXTAUTH_URL;

  if (!secret) {
    throw new Error(
      "AUTH_SECRET environment variable is not set. Generate one with: openssl rand -base64 32"
    );
  }

  if (!url) {
    throw new Error(
      "NEXTAUTH_URL environment variable is not set. Set it to your deployment URL."
    );
  }

  if (process.env.NODE_ENV === "production" && secret === "pdbclad-dev-secret-change-in-production-abc123xyz") {
    throw new Error(
      "AUTH_SECRET must be changed from the default development value in production!"
    );
  }
};

validateAuthConfig();

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      name: "Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) return null;

        const isValid = await compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
