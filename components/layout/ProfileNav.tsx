'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getProfileMenu } from '@/lib/config'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

// Define extended session type
interface ExtendedSession {
  uid?: string
  role?: string
  [key: string]: any
}

export default function ProfileNav() {
  const pathname = usePathname() as string
  const { data: session, status } = useSession()
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    const extendedSession = session as ExtendedSession
    
    if (extendedSession?.role) {
      setRole(extendedSession.role as string)
    } else if (session) {
      setRole('user')
    } else {
      setRole(null)
    }
  }, [session, status])

  const profileMenu = getProfileMenu(role)

  if (status === 'loading') {
    return (
      <div className="flex gap-1 overflow-auto md:flex-col md:overflow-visible">
        {[1, 2, 3].map((item) => (
          <Button
            key={item}
            variant="ghost"
            size="sm"
            className="justify-start md:w-full animate-pulse"
            disabled
          >
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
          </Button>
        ))}
      </div>
    )
  }

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