import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

// Type untuk response API
export type ApiCart = {
  items: any[]
  total_quantity: number
  total_price: number
}

// Hitung total quantity untuk booking system (jumlah booking)
const countTotalQuantity = (cartItems: any[]) => {
  if (!Array.isArray(cartItems)) return 0
  return cartItems.length // Setiap item adalah 1 booking
}

// Hitung total price untuk booking system
const countTotalPrice = (cartItems: any[]) => {
  if (!Array.isArray(cartItems)) return 0
  return cartItems.reduce((acc, item) => acc + (Number(item.total) || 0), 0)
}

// Format item untuk response API cart - TAMBAH customerName & customerWa
const formatCartItem = (cartItem: any, productData: any) => {
  const baseItem = {
    id: cartItem.id,
    name: cartItem.name || productData?.name || 'Unknown Product',
    price: cartItem.price || productData?.price || 0,
    quantity: 1, // SELALU 1 untuk booking system
    total: cartItem.total || 0,
    // Booking-specific data
    date: cartItem.date,
    times: cartItem.times || [],
    people: cartItem.people || 1,
    addons: cartItem.addons || [],
    voucherDiscount: cartItem.voucherDiscount || 0,
    thumbnail: cartItem.thumbnail || productData?.thumbnail,
    slug: cartItem.slug || productData?.slug,
    // ✅ TAMBAH INI: customerName & customerWa
    customerName: cartItem.customerName || '',
    customerWa: cartItem.customerWa || '',
  }

  // Include original product data if available
  if (productData) {
    return {
      ...baseItem,
      product: {
        id: productData.id,
        name: productData.name,
        description: productData.description,
        gallery: productData.gallery,
        category: productData.category
      }
    }
  }

  return baseItem
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('🛒 Received cart request:', body)
    
    const cartItemsStore = body // array dari cart store dengan struktur booking

    // Kalau cart kosong
    if (!Array.isArray(cartItemsStore) || cartItemsStore.length === 0) {
      return NextResponse.json(
        {
          items: [],
          total_quantity: 0,
          total_price: 0,
        },
        { status: 200 },
      )
    }

    // Ambil semua produk dari Firestore untuk melengkapi data
    const querySnapshot = await getDocs(collection(db, 'products'))
    const allProducts = querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        price: Number(data.price) || 0,
      }
    })

    console.log('📚 Found products:', allProducts.length)

    // Process cart items untuk booking system
    const items = await Promise.all(
      cartItemsStore.map(async (cartItem) => {
        try {
          // Extract original product ID (tanpa timestamp)
          const originalProductId = cartItem.id.split('-')[0]
          const productData = allProducts.find((p: any) => p.id === originalProductId)
          
          console.log(`🔍 Matching ${cartItem.id} to product:`, productData)
          console.log(`👤 Customer data:`, { 
            name: cartItem.customerName, 
            wa: cartItem.customerWa 
          })
          
          return formatCartItem(cartItem, productData)
        } catch (error) {
          console.error(`Error processing cart item ${cartItem.id}:`, error)
          return formatCartItem(cartItem, null) // Return basic data if error
        }
      })
    )

    const total_quantity = countTotalQuantity(cartItemsStore)
    const total_price = countTotalPrice(cartItemsStore)

    console.log('✅ Final cart response:', { 
      itemCount: items.length, 
      total_quantity, 
      total_price,
      firstItem: items[0] // Log first item untuk debug
    })

    return NextResponse.json(
      {
        items: items,
        total_quantity,
        total_price,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('❌ Error processing cart:', error)
    return NextResponse.json(
      { error: 'Failed to process cart data' },
      { status: 500 },
    )
  }
}

// GET method untuk mendapatkan cart data
export async function GET() {
  try {
    return NextResponse.json(
      {
        items: [],
        total_quantity: 0,
        total_price: 0,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Error in cart GET:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 },
    )
  }
}