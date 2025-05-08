import NextAuth from "next-auth";
import clientPromise from "@/lib/mongodb";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import EmailProvider from "next-auth/providers/email";

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise, { databaseName: "quicknote" }), // Specify database name
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
    // ...add more providers here
  ],
  // Optional: Add session, pages, etc.
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, user }) {
      // Send properties to the client, like an access_token and user id from a provider.
      if (session.user) {
        session.user.id = user.id; // Add the user ID to the session object
      }
      return session;
    },
  },
  // session: { strategy: "jwt" },
  // pages: { signIn: '/auth/signin' },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
