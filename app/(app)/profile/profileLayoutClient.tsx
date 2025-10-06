'use client'

import ProfileNav from '@/components/layout/ProfileNav'
import TanstackQueryProvier from '@/components/TanstackQueryProvier'
import { Separator } from '@/components/ui/separator'
import { cn, isOrderDetails } from '@/lib/utils'
import { usePathname } from 'next/navigation'

interface ProfileLayoutClientProps {
  children: React.ReactNode
  initialRole: string
}

export default function ProfileLayoutClient({ 
  children, 
  initialRole 
}: ProfileLayoutClientProps) {
  const pathname = usePathname() ?? ''
  const urlSplit = pathname.split('/')
  const orderDetailsPage = isOrderDetails(urlSplit)

  return (
    <div className='flex flex-col gap-5 md:flex-row md:gap-10'>
      {/* Sidebar Navigation */}
      <div
        className={cn(
          'flex-1 md:max-w-[200px]',
          orderDetailsPage ? 'hidden md:block' : ''
        )}
      >
        <h4 className='mb-2 hidden md:block'>Menu</h4>
        {/* 🔥 Kirim role ke ProfileNav */}
        <ProfileNav userRole={initialRole} />
      </div>

      <Separator
        className={cn('block md:hidden', orderDetailsPage ? 'hidden' : '')}
      />

      {/* Main Content */}
      <div className='flex-1'>
        <TanstackQueryProvier>{children}</TanstackQueryProvier>
      </div>
    </div>
  )
}