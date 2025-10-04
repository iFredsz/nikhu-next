
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

  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: checkoutData.gross_amount,
    },
    item_details: checkoutData.items,
    page_expiry: {
      duration: 3,
      unit: 'hours',
    },
    enabled_payments: ['bca_va'],
    customer_details: {
      id: uid, // bisa tambahkan email, name, phone jika ada
    },
  }

  // createTransaction mengembalikan object { token, redirect_url }
  const tokenResponse = await snap.createTransaction(parameter)

  return {
    token: tokenResponse.token,
    redirect_url: tokenResponse.redirect_url,
  }
}
