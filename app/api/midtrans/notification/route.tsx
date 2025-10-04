import { NextResponse } from 'next/server'
import midtransClient from 'midtrans-client'
import { UpdateOrder } from '@/lib/actions/firestore/update-order'

export async function POST(req: Request) {
  try {
    // ✅ Parse body dari Midtrans
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    // ✅ Setup Core API
    const coreApi = new midtransClient.CoreApi({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER!,
      clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT!,
    })

    // ✅ Ambil status transaksi
    let statusResponse
    try {
      statusResponse = await coreApi.transaction.notification(body)
    } catch (err: any) {
      console.error('Midtrans API Error:', err.message || err)
      return NextResponse.json(
        { success: false, message: 'Midtrans API Error' },
        { status: 400 }
      )
    }

    console.log('Notif dari Midtrans:', JSON.stringify(statusResponse, null, 2))

    const orderId = statusResponse?.order_id
    const transactionStatus = statusResponse?.transaction_status

    if (!orderId || !transactionStatus) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // ✅ Pisahkan UID dan orderId dari format UID-ORDERID
    const splitIndex = orderId.indexOf('-')
    const uid = orderId.slice(0, splitIndex)
    const pureOrderId = orderId.slice(splitIndex + 1)

    console.log(`Updating Firestore -> users/orders/${uid}/${pureOrderId}`)

    // ✅ Update Firestore sesuai status transaksi
    if (transactionStatus === 'settlement') {
      await UpdateOrder(uid, pureOrderId, { payment_status: 'success' })
    } else if (transactionStatus === 'pending') {
      await UpdateOrder(uid, pureOrderId, { payment_status: 'pending' })
    } else if (['cancel', 'expire', 'deny'].includes(transactionStatus)) {
      await UpdateOrder(uid, pureOrderId, { payment_status: 'failure' })
    } else {
      console.warn('Unknown transaction status:', transactionStatus)
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('Notif error:', error)
    return NextResponse.json(
      { success: false, message: String(error) },
      { status: 500 }
    )
  }
}
