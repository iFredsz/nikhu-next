'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getProfileMenu } from '@/lib/config'
import { isOrderDetails } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { getAuth } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/app/firebase' // pastikan ini mengarah ke instance Firestore kamu

export default function ProfileNav() {
  const pathname = usePathname() as string
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    const fetchRole = async () => {
      const auth = getAuth()
      const user = auth.currentUser

      if (user) {
        // misalnya role disimpan di Firestore /users/{uid}/role
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          setRole(data.role || 'user')
        } else {
          setRole('user')
        }
      } else {
        setRole('user')
      }
    }

    fetchRole()
  }, [])

  const profileMenu = getProfileMenu(role)

  return (
    <div className="flex gap-1 overflow-auto md:flex-col md:overflow-visible">
      {profileMenu.map((menu) => (
        <Button
          variant={pathname === menu.href ? 'secondary' : 'ghost'}
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
