'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getProfileMenu } from '@/lib/config'
import { useSession } from 'next-auth/react'

interface ExtendedSession {
  uid?: string
  role?: string
  [key: string]: any
}

export default function ProfileNav() {
  const pathname = usePathname() as string
  const { data: session } = useSession()
  
  // 🔥 LANGSUNG PAKAI ROLE DARI SESSION ATAU DEFAULT 'user'
  const role = (session as ExtendedSession)?.role || 'user'
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