'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { auth } from '@/lib/firebase'
import {
  verifyPasswordResetCode,
  confirmPasswordReset,
} from 'firebase/auth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const oobCode = searchParams?.get('oobCode') ?? ''
  const [email, setEmail] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode) {
        setError('Invalid reset link.')
        setLoading(false)
        return
      }

      try {
        const userEmail = await verifyPasswordResetCode(auth, oobCode)
        setEmail(userEmail)
      } catch (err) {
        setError('Link tidak valid atau sudah kadaluarsa.')
      } finally {
        setLoading(false)
      }
    }

    verifyCode()
  }, [oobCode])

  const handleSubmit = async () => {
    if (!oobCode || !email) return
    if (newPassword !== confirmPassword) {
      toast.error('Password tidak sama!')
      return
    }

    try {
      setError(null)
      setMessage(null)
      await confirmPasswordReset(auth, oobCode, newPassword)
      toast.success('Password berhasil direset! Silakan login kembali.')
      setMessage('Password berhasil direset! Silakan login kembali.')
      setTimeout(() => router.push('/login'), 2500)
    } catch (err) {
      toast.error('Gagal reset password. Coba lagi.')
      setError('Gagal reset password. Coba lagi.')
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Memuat halaman reset password...
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-indigo-600 mb-2 text-center">
          🔐 Reset Your Password
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Untuk akun <b>{email}</b>
        </p>

        {error && (
          <div className="bg-red-50 text-red-500 text-sm p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        {message && (
          <div className="bg-green-50 text-green-600 text-sm p-3 rounded-md mb-4">
            {message}
          </div>
        )}

        {!message && (
          <>
            <div className="space-y-4">
              <Input
                type="password"
                placeholder="Password baru"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Konfirmasi password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <Button
              onClick={handleSubmit}
              className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              Ubah Password
            </Button>
          </>
        )}

        <p className="text-xs text-center text-gray-400 mt-6">
          &copy; 2025 Nikhu Studio. All rights reserved.
        </p>
      </div>
    </div>
  )
}
