import { NextResponse } from 'next/server'
import midtransClient from 'midtrans-client'
import { UpdateOrder } from '@/lib/actions/firestore/update-order'

export async function POST(req: Request) {
  try {
    // Ambil raw body dari Midtrans (lebih aman untuk notification)
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 })
    }

    const coreApi = new midtransClient.CoreApi({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER!,
      clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT!,
    })

    let statusResponse
    try {
      statusResponse = await coreApi.transaction.notification(body)
    } catch (err: any) {
      console.error('Midtrans API Error:', err.message || err)
      return NextResponse.json({ success: false, message: 'Midtrans API Error' }, { status: 400 })
    }

    console.log('Notif dari Midtrans:', JSON.stringify(statusResponse, null, 2))

    const orderId = statusResponse?.order_id
    const transactionStatus = statusResponse?.transaction_status
    const fraudStatus = statusResponse?.fraud_status

    if (!orderId || !transactionStatus) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 })
    }

    // Format UID-ORDERID
    const [uid, ...rest] = orderId.split('-')
    const pureOrderId = rest.join('-')

    // Update Firestore sesuai status
    if (transactionStatus === 'settlement') {
      await UpdateOrder(uid, pureOrderId, { payment_status: 'success' })
    } else if (transactionStatus === 'pending') {
      await UpdateOrder(uid, pureOrderId, { payment_status: 'pending' })
    } else if (['cancel', 'expire', 'deny'].includes(transactionStatus)) {
      await UpdateOrder(uid, pureOrderId, { payment_status: 'failure' })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('Notif error:', error)
    return NextResponse.json({ success: false, message: String(error) }, { status: 500 })
  }
}
