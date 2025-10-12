'use client'

import Image from 'next/image'
import { Menu as MenuIcon } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navMenu } from '@/lib/config'
import { cn } from '@/lib/utils'
import { useState } from 'react'

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const pathName = usePathname()

  const handleClose = () => setIsOpen(false)

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {/* Trigger Icon */}
      <SheetTrigger asChild>
        <MenuIcon className='ml-2 h-5 w-5 md:hidden cursor-pointer' />
      </SheetTrigger>

      {/* Drawer Menu */}
      <SheetContent side='left' className='focus:[&>button]:shadow-none'>
        <SheetHeader className='mb-8'>
          <SheetTitle>
            <Link href='/' onClick={handleClose}>
              <div className='flex items-center gap-2'>
                <Image
                  src='/nikhulogo.webp'
                  alt='Nikhu Studio Logo'
                  width={120}
                  height={40}
                  className='object-contain'
                  priority
                />
              </div>
            </Link>
          </SheetTitle>
        </SheetHeader>

        {/* Menu Items */}
        <ul className='flex flex-col gap-4 text-sm'>
          {navMenu.map((menu) => (
            <li key={menu.title} onClick={handleClose}>
              <Link
                href={menu.href}
                className={cn(
                  'transition-colors hover:text-amber-500',
                  pathName === menu.href && 'font-bold text-amber-600'
                )}
              >
                {menu.title}
              </Link>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  )
}
