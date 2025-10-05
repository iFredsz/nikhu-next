import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export default async function middleware(req: NextRequest) {
  const token = await getToken({ req })
  const { pathname } = req.nextUrl

  const adminPaths = [
    '/profile/admin',
    '/profile/admin/edit-layout',
    '/profile/admin/edit-product',
  ]

  // 🔹 Cek akses admin
  if (adminPaths.some((path) => pathname.startsWith(path))) {
    if (!token) {
      const url = req.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    if (token.role !== 'admin') {
      const url = req.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // 🔹 Cek login untuk profile biasa
  if (!token && pathname.startsWith('/profile')) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
