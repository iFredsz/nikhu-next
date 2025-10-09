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
    console.log('Cart items count:', cartItemsStore?.length || 0)

    // Validasi cart items lebih ketat
    if (!cartItemsStore || cartItemsStore.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    // Validasi setiap item
    const invalidItems = cartItemsStore.filter(item => 
      !item.date || 
      !item.times || 
      !Array.isArray(item.times) || 
      item.times.length === 0
    )

    if (invalidItems.length > 0) {
      console.error('Invalid cart items:', invalidItems)
      return NextResponse.json({ error: 'Some cart items are invalid' }, { status: 400 })
    }

    // Generate checkout data (tanpa orderId dulu)
    console.log('Generating checkout data...')
    const checkoutData: Midtrans_Checkout_Data = await generateCheckoutData(cartItemsStore)
    console.log('Checkout data generated successfully')
    
    // Simpan ke Firestore DULU untuk mendapatkan orderId
    console.log('Saving to Firestore...')
    const orderId: string = (await addNewOrder(uid, checkoutData)) as string
    console.log('Order saved with ID:', orderId)
    
    if (!orderId) {
      throw new Error('Failed to generate order ID')
    }

    // Generate token Midtrans dengan orderId yang baru
    console.log('Generating Midtrans token...')
    const token: Midtrans_Generate_Token = await generateToken(checkoutData, orderId, uid)
    console.log('Midtrans token generated successfully')

    // Update order di Firestore dengan token dan order_id
    console.log('Updating order with token...')
    await UpdateOrder(uid, orderId, { 
      token: token.token,
      redirect_url: token.redirect_url,
      order_id: orderId,
      midtrans_order_id: orderId,
      updated_at: new Date().toISOString(),
      expire_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), //cron job hapus 15 menit
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
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json(
      { 
        error: 'Something went wrong when placing the order...',
        details: errorMessage 
      },
      { status: 500 }
    )
  }
}