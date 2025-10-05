// app/api/auth/[...nextauth]/route.ts - YANG LEBIH CEPAT
// @ts-nocheck

import NextAuth, { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/app/firebase' // 🔥 HAPUS db IMPORT

export const authOptions: AuthOptions = {
  pages: {
    signIn: '/signin',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {},
      async authorize(credentials) {
        return await signInWithEmailAndPassword(
          auth,
          (credentials as any).email || '',
          (credentials as any).password || '',
        )
          .then((userCredential) => {
            if (userCredential.user) {
              // 🔥 LANGSUNG RETURN TANPA FETCH FIRESTORE
              return {
                id: userCredential.user.uid, // NextAuth wajib ada 'id'
                uid: userCredential.user.uid,
                email: userCredential.user.email,
                // Role akan di-fetch langsung di component nanti
              }
            }
            return null
          })
          .catch((error) => {
            console.log(error)
            return null
          })
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.uid
        // 🔥 Token TIDAK PERLU ROLE di sini
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.uid = token.uid as string
        // 🔥 Session TIDAK PERLU ROLE di sini
      }
      return session
    },
  },
  // 🔥 TAMBAHKAN UNTUK PERFORMANCE
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
}

export default NextAuth(authOptions)