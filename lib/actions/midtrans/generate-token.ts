const midtransClient: any = require('midtrans-client')
import { Midtrans_Checkout_Data } from './generate-checkout-data'

export type Midtrans_Generate_Token = {
  token: string
  redirect_url: string
}

export async function generateToken(
  checkoutData: Midtrans_Checkout_Data,
  orderId: string,
  uid: string
): Promise<Midtrans_Generate_Token> {
  const snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER,
    clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT,
  })

  // ✅ Maksimal panjang order_id adalah 50 karakter
  // gabungkan UID pendek + orderId + random 4 huruf agar tetap unik
  const shortUid = uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6) // 6 huruf aman
  const shortOrder = orderId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 30) // 30 huruf
  const randomSuffix = Math.random().toString(36).substring(2, 6) // 4 huruf random
  const composedOrderId = `${shortUid}-${shortOrder}-${randomSuffix}`.slice(0, 49)

  const parameter = {
    transaction_details: {
      order_id: composedOrderId,
      gross_amount: checkoutData.gross_amount,
    },
    item_details: checkoutData.items,
    page_expiry: {
      duration: 3,
      unit: 'hours',
    },
    enabled_payments: ['bca_va'],
    customer_details: {
      id: uid,
    },
    metadata: {
      extra_info: { user_id: uid },
    },
  }

  const tokenResponse = await snap.createTransaction(parameter)

  return {
    token: tokenResponse.token,
    redirect_url: tokenResponse.redirect_url,
  }
}
