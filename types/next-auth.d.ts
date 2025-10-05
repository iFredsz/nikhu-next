// types/next-auth.d.ts
import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    uid: string
    role: string
  }

  interface User {
    uid: string
    role: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    uid: string
    role: string
  }
}