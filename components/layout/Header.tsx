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
    <header className="fixed top-0 left-0 w-full z-50 bg-transparent">
      <div className="container mx-auto flex items-center justify-between py-4 px-4 md:px-8">
        {/* Left side - logo and menu */}
        <div className="flex items-center gap-2">
          {/* Mobile burger with circle */}
          <div className="p-2 rounded-full bg-white/90 shadow-sm backdrop-blur-sm md:hidden">
            <MobileMenu />
          </div>

          {/* Logo with wrapper */}
          <Link href="/" className="hidden md:block">
            <div className="rounded-2xl bg-white/70 shadow-sm backdrop-blur-sm p-2">
              <div className="relative w-52 h-12">
                <Image
                  src="/nikhulogo.webp"
                  alt="Nikhu Studio"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </Link>
        </div>

        {/* Desktop menu with wrapper */}
        <div className="hidden md:block rounded-2xl bg-white/70 shadow-sm backdrop-blur-sm px-4 py-2">
          <DesktopMenu />
        </div>

        {/* Right side - cart & user (not wrapped) */}
        <div className="flex items-center gap-3">
          <TanstackQueryProvier>
            <Cart />
          </TanstackQueryProvier>

          {session.status === 'unauthenticated' ? (
            <LoginButton />
          ) : (
            <UserAccountNav />
          )}
        </div>
      </div>
    </header>
  )
}
