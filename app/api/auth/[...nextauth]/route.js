import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

import { connectToDB } from "@mongodb";
import User from "@models/User";
export const authOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {},
      async authorize(credentials) {
        try {
          await connectToDB();
          const user = await User.findOne({ email: credentials.email })
          // console.log(user);
          if (!user) throw new Error("user is not found");
          const isMatch = await compare(credentials.password, user.password);

          if (!isMatch) {
            throw new Error("Invalid password");
          }
          return user;
        } catch (error) {
          console.log(error.message);
          return null;
        }
      }
    })
  ],

  secret: process.env.NEXTAUTH_SECRET,
  session: {
    jwt: true,
    maxAge: 24 * 60 * 60, // 1 day in seconds
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 1 day in seconds
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = user.username;
        token.email = user.email;
        token.id = user.id;
      }
      return token;
    },
    async session({ session }) {
      const mongodbUser = await User.findOne({ email: session.user.email })
      session.user.id = mongodbUser._id.toString()
      session.user = { ...session.user, ...mongodbUser._doc }
      return session
    }
  }
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }