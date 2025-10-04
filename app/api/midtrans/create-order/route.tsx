import { NextResponse } from 'next/server'
import { CartItemsStore } from '@/store/cart-store'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { UpdateOrder } from '@/lib/actions/firestore/update-order'
import { Midtrans_Checkout_Data, generateCheckoutData } from '@/lib/actions/midtrans/generate-checkout-data'
import { addNewOrder } from '@/lib/actions/firestore/add-new-order'
import { Midtrans_Generate_Token, generateToken } from '@/lib/actions/midtrans/generate-token'

export type Api_Midtrans_Create_Order = {
  orderId: string
  token?: string
  redirect_url?: string
}

function generateShortOrderId(uid: string) {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).substring(2, 6)
  return `ORD-${uid}-${ts}-${rand}`.slice(0, 50)
}

export async function POST(req: Request) {
  let orderId = ''
  let uid = ''

  try {
    const session: any = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
    }

    const body = await req.json()
    const cartItemsStore: CartItemsStore[] = body.items || body

    if (!cartItemsStore || !Array.isArray(cartItemsStore) || cartItemsStore.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    uid = session.uid
    orderId = generateShortOrderId(uid)

    console.log('🔄 Creating order:', orderId)

    // Transform cart items
    const transformedCartItems = cartItemsStore.map(item => ({
      ...item,
      id: item.id.split('-')[0],
      quantity: 1,
      metadata: {
        originalId: item.id,
        date: item.date,
        times: item.times,
        people: item.people,
        addons: item.addons,
        voucherDiscount: item.voucherDiscount,
      },
    }))

    // **STEP 1: Generate checkout data Midtrans (cepat)**
    console.log('🔗 Generating checkout data...')
    const checkoutData: Midtrans_Checkout_Data = await generateCheckoutData(transformedCartItems, orderId)

    // **STEP 2: Generate token Midtrans DULU (sebelum simpan ke Firestore)**
    console.log('🔗 Generating Midtrans token...')
    const token: Midtrans_Generate_Token = await generateToken(checkoutData, orderId, uid)
    console.log('✅ Midtrans token generated')

    // **STEP 3: Baru simpan ke Firestore JIKA token berhasil**
    console.log('💾 Saving order to Firestore...')
    
    const orderData = {
      ...checkoutData,
      bookingDetails: cartItemsStore.map(item => ({
        productId: item.id.split('-')[0],
        originalCartId: item.id,
        name: item.name,
        date: item.date,
        times: item.times,
        people: item.people,
        addons: item.addons,
        voucherDiscount: item.voucherDiscount,
        thumbnail: item.thumbnail,
        slug: item.slug,
        total: item.total,
        customerName: item.customerName,
        customerWa: item.customerWa,
      })),
      customerName: cartItemsStore[0]?.customerName || '',
      customerWa: cartItemsStore[0]?.customerWa || '',
      payment_status: 'pending',
      orderId: orderId,
      token: token.token,
      midtransRedirectUrl: token.redirect_url,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Simpan order ke Firestore
    await addNewOrder(uid, orderData)
    console.log('✅ Order saved to Firestore')

    return NextResponse.json({
      orderId,
      token: token.token,
      redirect_url: token.redirect_url,
    })

  } catch (error: any) {
    console.error('❌ Create order error:', error)
    
    // **HAPUS ORDER DARI FIRESTORE JIKA ADA YANG GAGAL**
    if (orderId && uid) {
      try {
        console.log('🧹 Cleaning up failed order from Firestore...')
        await UpdateOrder(uid, orderId, {
          payment_status: 'failed',
          error_message: error.message,
          updatedAt: new Date().toISOString(),
        })
        console.log('✅ Failed order cleaned up')
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup order:', cleanupError)
      }
    }
    
    return NextResponse.json({ 
      error: `Failed to create order: ${error.message}` 
    }, { status: 500 })
  }
}