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
import { useSession } from 'next-auth/react'

export default function UserAccountNav() {
  const [isOpen, setIsOpen] = useState(false)
  const [role, setRole] = useState<string>('user')
  const { data: session } = useSession()

  // 🔥 Fetch role dari API route
  useEffect(() => {
    const fetchRole = async () => {
      try {
        const res = await fetch('/api/user/role')
        const data = await res.json()
        setRole(data.role)
      } catch (error) {
        console.error('Error fetching role:', error)
      }
    }

    if (session) {
      fetchRole()
    }
  }, [session])

  const handleClose = () => setIsOpen(false)

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
          <DropdownMenuItem key={menuItem.title} onClick={handleClose} asChild>
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