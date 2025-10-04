import { NextResponse } from 'next/server'
import { CartItemsStore } from '@/store/cart-store'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { UpdateOrder } from '@/lib/actions/firestore/update-order'
import {
  Midtrans_Checkout_Data,
  generateCheckoutData,
} from '@/lib/actions/midtrans/generate-checkout-data'
import { addNewOrder } from '@/lib/actions/firestore/add-new-order'
import { Midtrans_Generate_Token, generateToken } from '@/lib/actions/midtrans/generate-token'

export async function POST(req: Request) {
  try {
    const session: any = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

    const body = await req.json()
    const cartItemsStore: CartItemsStore[] = body
    const uid = session.uid

    console.log('=== ORDER CREATION DEBUG ===')
    console.log('Session UID:', uid)
    console.log('Cart items count:', cartItemsStore.length)

    // Validasi cart items
    if (!cartItemsStore || cartItemsStore.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    // Generate checkout data (tanpa orderId dulu)
    const checkoutData: Midtrans_Checkout_Data = await generateCheckoutData(cartItemsStore)
    console.log('Checkout data generated')
    
    // Simpan ke Firestore DULU untuk mendapatkan orderId
    console.log('Saving to Firestore...')
    const orderId: string = (await addNewOrder(uid, checkoutData)) as string
    console.log('Order saved with ID:', orderId)
    
    // Generate token Midtrans dengan orderId yang baru
    console.log('Generating Midtrans token...')
    const token: Midtrans_Generate_Token = await generateToken(checkoutData, orderId, uid)
    console.log('Midtrans token generated')

    // Update order di Firestore dengan token dan order_id
    console.log('Updating order with token...')
    await UpdateOrder(uid, orderId, { 
      token: token.token,
      redirect_url: token.redirect_url,
      order_id: orderId, // Sekarang order_id sudah ada
      midtrans_order_id: orderId,
      updated_at: new Date().toISOString()
    })

    console.log('=== ORDER CREATION SUCCESS ===')
    
    return NextResponse.json({ 
      success: true,
      orderId: orderId,
      token: token.token,
      redirect_url: token.redirect_url
    })
    
  } catch (error) {
    console.error('=== ORDER CREATION ERROR ===')
    console.error('Error details:', error)
    return NextResponse.json(
      { error: 'Something went wrong when placing the order...' },
      { status: 500 }
    )
  }
}