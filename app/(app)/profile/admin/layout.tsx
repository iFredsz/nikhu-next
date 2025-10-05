'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'

const adminMenu = [
  { title: 'Orders', href: '/profile/admin' },
  { title: 'Edit Layout', href: '/profile/admin/edit-layout' },
  { title: 'Edit Product', href: '/profile/admin/edit-product' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''

  return (
    <div className='flex flex-col md:flex-row gap-3'>
      {/* Sidebar */}
      <aside className='md:w-36'>
        <nav className='flex md:flex-col gap-0.5 overflow-auto md:overflow-visible'>
          {adminMenu.map((menu) => (
            <Button
              key={menu.href}
              variant={pathname === menu.href ? 'secondary' : 'ghost'}
              size='sm'
              className='justify-start w-full text-xs py-1.5'
              asChild
            >
              <Link href={menu.href}>{menu.title}</Link>
            </Button>
          ))}
        </nav>
      </aside>

      {/* Konten utama */}
      <main className='flex-1 text-xs'>{children}</main>
    </div>
  )
}
