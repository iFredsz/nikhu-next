'use client'

import Link from 'next/link'
import UserAccountNav from '../auth/UserAccountNav'
import MobileMenu from './MobileMenu'
import DesktopMenu from './DesktopMenu'
import Cart from '../cart/Cart'
import LoginButton from './LoginButton'
import { useSession } from 'next-auth/react'
import TanstackQueryProvier from '../TanstackQueryProvier'
import Image from 'next/image'

export default function Header() {
  const session = useSession()

  return (
    <header className='flex items-center justify-between py-4'>
      <div className='flex items-center gap-2'>
        <MobileMenu />

        <Link href='/' className='hidden md:block'>
          <div className='relative w-52 h-12'>
  <Image
    src='/nikhulogo.png'
    alt='Nikhu Studio'
    fill
    className='object-contain'
    priority
  />
</div>

        </Link>
      </div>
      <div className='hidden md:block'>
        <DesktopMenu />
      </div>

      <div className='flex items-center gap-4'>
        <TanstackQueryProvier>
          <Cart />
        </TanstackQueryProvier>

        {session.status === 'unauthenticated' ? <LoginButton /> : <UserAccountNav />}
      </div>
    </header>
  )
}
