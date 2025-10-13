export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { adminDb } from '@/lib/firebase-admin'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    console.log('🔍 API Role - Session:', session)
    
    const uid = (session as any)?.user?.id || (session as any)?.uid
    console.log('🔍 API Role - UID:', uid)
    
    if (!uid) {
      return NextResponse.json({ role: 'user' })
    }

    const userDoc = await adminDb.collection('users').doc(uid).get()
    console.log('🔍 API Role - UserDoc exists:', userDoc.exists)
    
    const role = userDoc.exists ? userDoc.data()?.role || 'user' : 'user'
    console.log('🔍 API Role - Final Role:', role)

    return NextResponse.json({ role })
  } catch (error) {
    console.error('❌ API Role - Error:', error)
    return NextResponse.json({ role: 'user' }, { status: 500 })
  }
}