import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collectionGroup, getDocs, updateDoc, doc } from 'firebase/firestore'

export async function GET() {
  try {
    const now = new Date()
    let expiredCount = 0

    // Ambil semua subcollection "orders" di semua user
    const ordersSnapshot = await getDocs(collectionGroup(db, 'orders'))

    const updates = ordersSnapshot.docs.map(async (orderDoc) => {
      const data = orderDoc.data()
      const paymentStatus = data.payment_status
      const expireAt = data.expire_at?.toDate?.() || data.expire_at

      // Cek kalau status masih pending dan sudah lewat waktu expire
      if (paymentStatus === 'pending' && expireAt && expireAt < now) {
        await updateDoc(orderDoc.ref, {
          payment_status: 'expired',
        })
        expiredCount++
      }
    })

    await Promise.all(updates)

    return NextResponse.json({
      success: true,
      message: `${expiredCount} order(s) expired successfully.`,
    })
  } catch (error) {
    console.error('Cron error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to expire orders.', error: String(error) },
      { status: 500 }
    )
  }
}
