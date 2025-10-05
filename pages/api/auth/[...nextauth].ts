// @ts-nocheck
import NextAuth, { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/app/firebase'


export const authOptions: AuthOptions = {
  pages: {
    signIn: '/signin',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {},
      async authorize(credentials, req) {
        try {
          const userCredential = await signInWithEmailAndPassword(
            auth,
            credentials.email || '',
            credentials.password || ''
          )

          const user = userCredential.user
          if (!user) return null

          // Ambil role user dari Firestore
          const userRef = adminDb.collection('users').doc(user.uid)
          const doc = await userRef.get()
          const role = doc.exists ? doc.data()?.role : 'user'

          // Gabungkan user dan role
          return {
            uid: user.uid,
            email: user.email,
            role,
          }
        } catch (error) {
          console.error('Login error:', error)
          return null
        }
      },
    }),
  ],

  callbacks: {
    // Simpan uid & role ke token
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.uid
        token.role = user.role || 'user'
      }
      return token
    },

    // Simpan ke session supaya bisa diakses di client
    async session({ session, token }) {
      if (token) {
        session.uid = token.uid
        session.role = token.role
      }
      return session
    },
  },
}

export default NextAuth(authOptions)
