// components/layout/ProfileNavServer.tsx - YANG LEBIH CEPAT
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getProfileMenu } from '@/lib/config'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/app/firebase'

export default async function ProfileNavServer() {
  const session = await getServerSession(authOptions)
  let role = 'user'
  
  if (session?.uid) {
    try {
      // 🔥 FETCH LANGSUNG DARI FIRESTORE - LEBIH CEPAT
      const userDocRef = doc(db, 'users', session.uid)
      const userDoc = await getDoc(userDocRef)
      if (userDoc.exists()) {
        role = userDoc.data().role || 'user'
      }
    } catch (error) {
      console.error('Error fetching role:', error)
    }
  }
  
  const profileMenu = getProfileMenu(role)

  return (
    <div className="flex gap-1 overflow-auto md:flex-col md:overflow-visible">
      {profileMenu.map((menu) => (
        <Button
          variant="ghost"
          size="sm"
          className="justify-start md:w-full"
          key={menu.title}
          asChild
        >
          <Link href={menu.href}>
            {menu.icon && <menu.icon className="mr-2 h-4 w-4" />}
            {menu.title}
          </Link>
        </Button>
      ))}
    </div>
  )
}