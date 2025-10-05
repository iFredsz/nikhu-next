'use client'

import TanstackQueryProvier from '@/components/TanstackQueryProvier'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { getProfileMenu } from '@/lib/config'
import { cn, isOrderDetails } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import { app } from '@/app/firebase'

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '' // ✅ fallback agar tidak null
  const urlSplit = pathname.split('/')
  const orderDetailsPage = isOrderDetails(urlSplit)

  const { data: session } = useSession()
  const [role, setRole] = useState<string | null>(null)

  // 🔥 Ambil role user dari Firestore
  useEffect(() => {
    const fetchRole = async () => {
      try {
        const uid =
          (session as any)?.user?.id ||
          (session as any)?.user?.uid ||
          (session as any)?.uid
        if (!uid) return

        const db = getFirestore(app)
        const userRef = doc(db, 'users', uid)
        const snap = await getDoc(userRef)

        if (snap.exists()) {
          setRole(snap.data().role || null)
        } else {
          setRole(null)
        }
      } catch (error) {
        console.error('Error fetching user role:', error)
      }
    }

    fetchRole()
  }, [session])

  const profileMenu = getProfileMenu(role)

  return (
    <div className='flex flex-col gap-5 md:flex-row md:gap-10'>
      <div
        className={cn(
          'flex-1 md:max-w-[200px]',
          orderDetailsPage ? 'hidden md:block' : ''
        )}
      >
        <h4 className='mb-2 hidden md:block'>Menu</h4>
        <div className='flex gap-1 overflow-auto md:flex-col md:overflow-visible'>
          {profileMenu.map((menu) => (
            <Button
              variant={pathname === menu.href ? 'secondary' : 'ghost'}
              size='sm'
              className='justify-start md:w-full'
              key={menu.title}
              asChild
            >
              <Link href={menu.href}>
                {menu.icon && <menu.icon className='mr-2 h-4 w-4' />}
                {menu.title}
              </Link>
            </Button>
          ))}
        </div>
      </div>

      <Separator
        className={cn('block md:hidden', orderDetailsPage ? 'hidden' : '')}
      />

      <div className='flex-1'>
        <TanstackQueryProvier>{children}</TanstackQueryProvier>
      </div>
    </div>
  )
}