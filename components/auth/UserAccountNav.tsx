'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import Link from 'next/link'
import {
  User as UserIcon,
  Package as PackageIcon,
  LogOut as LogOutIcon,
  Shield,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { signOutNextAuthFirebase } from '@/lib/actions/auth/sign-out-next-auth-firebase'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import { useSession } from 'next-auth/react'
import { app } from '@/app/firebase' // pastikan sudah benar path firebase config kamu

export default function UserAccountNav() {
  const [isOpen, setIsOpen] = useState(false)
  const [role, setRole] = useState<string | null>(null)
  const { data: session } = useSession()

  const handleClose = () => setIsOpen(false)

  // 🔥 Ambil role user dari Firestore berdasarkan UID
  useEffect(() => {
    const fetchUserRole = async () => {
      const uid = (session as any)?.uid
      if (!uid) return

      const db = getFirestore(app)
      const userRef = doc(db, 'users', uid)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        setRole(userSnap.data().role || null)
      }
    }

    fetchUserRole()
  }, [session])

  // 🔹 Menu dinamis
  const menu = [
    {
      title: 'Profile',
      href: '/profile',
      icon: UserIcon,
    },
    {
      title: 'Orders',
      href: '/profile/orders',
      icon: PackageIcon,
    },
    ...(role === 'admin'
      ? [
          {
            title: 'Admin',
            href: '/profile/admin',
            icon: Shield,
          },
        ]
      : []),
  ]

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger className='outline-none' asChild>
        <Avatar className='cursor-pointer'>
          <AvatarImage src={session?.user?.image || 'https://github.com/shadcn.png'} />
          <AvatarFallback>
            {session?.user?.name?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end'>
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {menu.map((menuItem) => (
          <DropdownMenuItem key={menuItem.title} onClick={handleClose}>
            <Link href={menuItem.href} className='flex items-center'>
              <menuItem.icon className='mr-2 h-4 w-4' />
              {menuItem.title}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className='cursor-pointer'
          onClick={() => {
            handleClose()
            signOutNextAuthFirebase()
          }}
        >
          <LogOutIcon className='mr-2 h-4 w-4' />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
