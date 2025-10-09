'use client'

import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth'
import { FormEventHandler, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import LoadingText from '@/components/LoadingText'

export default function Page() {
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [errorStatus, setErrorStatus] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loginData, setLoginData] = useState({ email: '', password: '' })

  // ⛔ Cegah render /login kalau sudah login
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace('/')
      } else {
        setCheckingAuth(false) // baru tampil kalau belum login
      }
    })
    return () => unsub()
  }, [router])

  const handleLogin: FormEventHandler = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorStatus('')
    try {
      await signInWithEmailAndPassword(auth, loginData.email, loginData.password)
      await signIn('credentials', {
        email: loginData.email,
        password: loginData.password,
        redirect: false,
      })
      router.replace('/')
    } catch (error: any) {
      setIsLoading(false)
      setErrorStatus(
        error.code === 'auth/invalid-credential'
          ? 'Email dan password salah. Coba lagi.'
          : error.code
      )
    }
  }

  // 🔒 Jangan tampilkan UI sebelum auth dicek
  if (checkingAuth) return null

  return (
    <div className='mx-auto mt-20 max-w-md'>
      <section className='mb-10 flex flex-col items-center'>
        <h2>Log in to your account</h2>
      </section>

      <section>
        <form onSubmit={handleLogin}>
          <div className='mb-6'>
            <label htmlFor='email' className='mb-2 block font-medium'>
              Email address
            </label>
            <Input
              type='email'
              id='email'
              placeholder='Email'
              required
              value={loginData.email}
              onChange={(e) =>
                setLoginData((prev) => ({ ...prev, email: e.target.value }))
              }
            />
          </div>

          <div className='mb-12'>
            <div className='flex justify-between'>
              <label htmlFor='password' className='mb-2 block font-medium'>
                Password
              </label>
              <Link href='/forgot-password' className='font-bold hover:opacity-90'>
                Forgot password?
              </Link>
            </div>
            <Input
              type='password'
              id='password'
              placeholder='Password'
              required
              value={loginData.password}
              onChange={(e) =>
                setLoginData((prev) => ({ ...prev, password: e.target.value }))
              }
            />
          </div>

          {errorStatus && (
            <p className='mb-4 text-center text-destructive'>{errorStatus}</p>
          )}
          <Button
            className='w-full'
            disabled={isLoading || !loginData.email || !loginData.password}
          >
            {isLoading ? <LoadingText /> : 'Log in'}
          </Button>
        </form>

        <p className='mt-10 text-center text-sm text-gray-600'>
          Not a member?
          <Link href='/signup' className='ml-2 font-bold text-primary hover:opacity-90'>
            Sign up
          </Link>
        </p>
      </section>
    </div>
  )
}
