import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { auth as adminAuth } from "@/lib/firebase-admin"
import { authConfig } from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  providers: [
    Credentials({
      credentials: {
        idToken: { label: "ID Token", type: "text" },
      },
      authorize: async (credentials) => {
        if (typeof credentials.idToken !== "string") {
          return null
        }
        try {
          const decodedToken = await adminAuth.verifyIdToken(credentials.idToken)
          return {
            id: decodedToken.uid,
            email: decodedToken.email,
            image: decodedToken.picture,
            name: decodedToken.name || decodedToken.email,
          }
        } catch (error) {
          console.error("Error verifying ID token:", error)
          return null
        }
      },
    }),
  ],
})
