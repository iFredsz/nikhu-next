'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, ReactNode } from 'react'

interface AuthGuardProps {
  children: ReactNode
  /**
   * If true, only authenticated users can access (protected page)
   * If false, only unauthenticated users can access (login/signup pages)
   */
  requireAuth?: boolean
  /**
   * Redirect path when guard blocks access
   */
  redirectTo?: string
}

export default function AuthGuard({
  children,
  requireAuth = true,
  redirectTo,
}: AuthGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still checking session

    if (requireAuth && status === 'unauthenticated') {
      // Protected page, but user not logged in
      router.replace(redirectTo || '/login')
    } else if (!requireAuth && status === 'authenticated') {
      // Public-only page (login/signup), but user already logged in
      router.replace(redirectTo || '/')
    }
  }, [status, requireAuth, redirectTo, router])

  // Show nothing while checking or redirecting
  if (status === 'loading') {
    return null
  }

  if (requireAuth && status === 'unauthenticated') {
    return null
  }

  if (!requireAuth && status === 'authenticated') {
    return null
  }

  return <>{children}</>
}