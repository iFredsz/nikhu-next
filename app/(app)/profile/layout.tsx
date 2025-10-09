import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import ProfileLayoutClient from './profileLayoutClient'
import { adminDb } from '@/lib/firebase-admin'

async function getUserRole(uid: string) {
  try {
    const userDoc = await adminDb.collection('users').doc(uid).get()
    return userDoc.exists ? userDoc.data()?.role || 'user' : 'user'
  } catch (error) {
    console.error('Error fetching user role:', error)
    return 'user'
  }
}

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  const uid = (session as any)?.user?.id || (session as any)?.uid
  
  let role = 'user'
  if (uid) {
    role = await getUserRole(uid)
  }

  return (
    <ProfileLayoutClient initialRole={role}>
      {children}
    </ProfileLayoutClient>
  )
}