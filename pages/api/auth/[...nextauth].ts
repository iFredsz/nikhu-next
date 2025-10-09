// @ts-nocheck

import NextAuth, { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '@/lib/firebase' // Pastikan db sudah di-import
import { doc, getDoc } from 'firebase/firestore'

export const authOptions: AuthOptions = {
  pages: {
    signIn: '/signin',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {},
      async authorize(credentials, req) {
        return await signInWithEmailAndPassword(
          auth,
          (credentials as any).email || '',
          (credentials as any).password || '',
        )
          .then(async (userCredential) => {
            if (userCredential.user) {
              // 🔹 Ambil data user dari Firestore untuk mendapatkan role
              const userDocRef = doc(db, 'users', userCredential.user.uid)
              const userDoc = await getDoc(userDocRef)
              
              if (userDoc.exists()) {
                const userData = userDoc.data()
                
                // 🔹 Return user object dengan role
                return {
                  uid: userCredential.user.uid,
                  email: userCredential.user.email,
                  role: userData.role || 'user', // Default role adalah 'user'
                  ...userCredential.user
                }
              } else {
                // Jika dokumen user tidak ditemukan, gunakan default role
                return {
                  uid: userCredential.user.uid,
                  email: userCredential.user.email,
                  role: 'user',
                  ...userCredential.user
                }
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
        token.role = user.role // 🔹 Tambahkan role ke token
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.uid = token.uid
        session.role = token.role // 🔹 Tambahkan role ke session
      }
      return session
    },
  },
}

export default NextAuth(authOptions)