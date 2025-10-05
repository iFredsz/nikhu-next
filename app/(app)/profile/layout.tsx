import TanstackQueryProvier from '@/components/TanstackQueryProvier'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { getProfileMenu } from '@/lib/config'
import { cn, isOrderDetails } from '@/lib/utils'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/app/firebase'

export default async function Layout({ children }: { children: React.ReactNode }) {
  // 🔥 Ambil pathname dari headers (alternative untuk server component)
  const pathname = await getPathnameFromHeaders()
  const urlSplit = pathname.split('/')
  const orderDetailsPage = isOrderDetails(urlSplit)

  // 🔥 Ambil session dan role langsung di server
  const session = await getServerSession(authOptions)
  let role = 'user'

  if (session?.uid) {
    try {
      const userDocRef = doc(db, 'users', session.uid)
      const userDoc = await getDoc(userDocRef)
      
      if (userDoc.exists()) {
        role = userDoc.data().role || 'user'
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
    }
  }

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

// 🔥 Helper function untuk mendapatkan pathname di server component
async function getPathnameFromHeaders(): Promise<string> {
  // Import dinamis untuk akses headers
  const { headers } = await import('next/headers')
  const headerList = await headers()
  const pathname = headerList.get('x-pathname') || headerList.get('referer') || '/'
  
  // Extract pathname dari referer atau use default
  if (pathname.startsWith('http')) {
    const url = new URL(pathname)
    return url.pathname
  }
  
  return pathname
}