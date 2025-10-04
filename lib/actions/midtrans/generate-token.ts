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

  // ✅ Buat order_id aman dan tidak melebihi batas 50 karakter
  const shortUid = uid.slice(0, 8) // ambil 8 karakter pertama dari UID agar tetap unik
  const composedOrderId = `${shortUid}-${orderId}`

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
    enabled_payments: ['bca_va'], // bisa tambah metode lain nanti (gopay, qris, dsb)
    customer_details: {
      id: uid, // optional
    },

    // ✅ Metadata tambahan (opsional, tapi tetap bisa bantu saat debugging)
    metadata: {
      extra_info: {
        user_id: uid,
      },
    },
  }

  // createTransaction mengembalikan object { token, redirect_url }
  const tokenResponse = await snap.createTransaction(parameter)

  return {
    token: tokenResponse.token,
    redirect_url: tokenResponse.redirect_url,
  }
}
