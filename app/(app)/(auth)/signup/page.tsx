'use client'

import { auth, db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { FormEventHandler, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import LoadingText from '@/components/LoadingText'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'

const STORAGE_KEY = 'signup_attempts'
const MAX_ATTEMPTS = 5
const WINDOW_MS = 5 * 60 * 1000
const MIN_INTERVAL_MS = 3000

function now() {
  return Date.now()
}

function getAttempts(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return arr.map((t) => Number(t)).filter(Boolean)
  } catch {
    return []
  }
}

function saveAttempts(arr: number[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
  } catch {}
}

function cleanAttempts(arr: number[]) {
  const cutoff = now() - WINDOW_MS
  return arr.filter((t) => t > cutoff)
}

function recordAttempt() {
  const arr = cleanAttempts(getAttempts())
  arr.push(now())
  saveAttempts(arr)
}

function attemptsCount() {
  return cleanAttempts(getAttempts()).length
}

function isRateLimited() {
  const arr = cleanAttempts(getAttempts())
  return arr.length >= MAX_ATTEMPTS
}

function lastAttemptTime() {
  const arr = cleanAttempts(getAttempts())
  if (arr.length === 0) return 0
  return arr[arr.length - 1]
}

export default function SignupPage() {
  const [errorStatus, setErrorStatus] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  const handleSignup: FormEventHandler = async (e) => {
    e.preventDefault()
    setErrorStatus('')
    setSuccess(false)

    if (signupData.password !== signupData.confirm) {
      setErrorStatus('Password dan konfirmasi password tidak sama.')
      toast.error('Password dan konfirmasi password tidak sama.')
      return
    }

    try {
      if (isRateLimited()) {
        const attempts = attemptsCount()
        toast.error(
          `Terlalu banyak percobaan. Coba lagi setelah beberapa menit. (${attempts}/${MAX_ATTEMPTS})`
        )
        return
      }

      const last = lastAttemptTime()
      if (last && now() - last < MIN_INTERVAL_MS) {
        toast.error('Jangan klik berkali-kali. Tunggu beberapa detik lalu coba lagi.')
        return
      }
    } catch {}

    setIsLoading(true)

    try {
      const response = await createUserWithEmailAndPassword(
        auth,
        signupData.email,
        signupData.password
      )

      const uid = response.user.uid
      const email = response.user.email
      if (!email) throw new Error('Email tidak tersedia')

      await setDoc(doc(db, 'users', uid), {
        uid,
        name: signupData.name,
        email,
        role: 'user',
        createdAt: new Date().toISOString()
      })

      await auth.signOut()
      recordAttempt()

      setSuccess(true)
      setIsLoading(false)
      toast.success('Sign up berhasil! Silakan login.')

      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (error: any) {
      console.log('Signup error:', error)
      try {
        recordAttempt()
      } catch {}

      let friendly = error?.code || error?.message || 'Terjadi kesalahan. Coba lagi.'
      if (typeof friendly === 'string') {
        if (friendly.includes('auth/email-already-in-use')) {
          friendly = 'Email sudah digunakan. Silakan login atau gunakan email lain.'
        } else if (friendly.includes('auth/invalid-email')) {
          friendly = 'Format email tidak valid.'
        } else if (friendly.includes('auth/weak-password')) {
          friendly = 'Password terlalu lemah. Gunakan minimal 6 karakter.'
        }
      }

      setErrorStatus(friendly)
      toast.error(String(friendly))
      setIsLoading(false)

      if (auth.currentUser) {
        auth.currentUser.delete().catch((err) => console.log('Rollback user failed:', err))
      }
    }
  }

  return (
    <div className="mx-auto mt-20 max-w-md">
      <section className="mb-10 flex flex-col items-center">
        <h2 className="text-2xl font-bold">Create Account</h2>
      </section>

      <section>
        <form onSubmit={handleSignup}>
          <div className="mb-4">
            <label htmlFor="name" className="mb-2 block font-medium">
              Name
            </label>
            <Input
              type="text"
              id="name"
              placeholder="Name"
              required
              value={signupData.name}
              onChange={(e) => setSignupData((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="mb-2 block font-medium">
              Email address
            </label>
            <Input
              type="email"
              id="email"
              placeholder="Email"
              required
              value={signupData.email}
              onChange={(e) => setSignupData((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="mb-2 block font-medium">
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Password"
                required
                value={signupData.password}
                onChange={(e) => setSignupData((prev) => ({ ...prev, password: e.target.value }))}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="confirm" className="mb-2 block font-medium">
              Confirm Password
            </label>
            <div className="relative">
              <Input
                type={showConfirm ? 'text' : 'password'}
                id="confirm"
                placeholder="Confirm Password"
                required
                value={signupData.confirm}
                onChange={(e) => setSignupData((prev) => ({ ...prev, confirm: e.target.value }))}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowConfirm((prev) => !prev)}
              >
                {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {errorStatus && <p className="mb-4 text-center text-destructive">{errorStatus}</p>}
          {success && (
            <p className="mb-4 text-center text-green-600">
              Sign up berhasil! Silakan login. Redirecting ke halaman login...
            </p>
          )}

          <Button
            className="w-full"
            disabled={isLoading || !signupData.name || !signupData.email || !signupData.password || !signupData.confirm}
            type="submit"
          >
            {isLoading ? <LoadingText /> : 'Sign up'}
          </Button>
        </form>

        <p className="mt-10 text-center text-sm text-gray-600">
          Already a member?
          <Link href="/login" className="ml-2 font-bold text-primary hover:opacity-90">
            Log in
          </Link>
        </p>
      </section>
    </div>
  )
}
