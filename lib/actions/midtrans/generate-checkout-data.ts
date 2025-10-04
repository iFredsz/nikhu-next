import { CartItemsStore } from '@/store/cart-store'
import { ApiCart } from '@/app/api/cart/route'

export type Midtrans_Checkout_Data = {
  items: any[]
  gross_amount: number
  total_quantity: number
  orderId?: string
}

// generate checkout data from zustand cart items store
export async function generateCheckoutData(cartItemsStore: CartItemsStore[], orderId: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/cart`, {
    body: JSON.stringify(cartItemsStore),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  })

  const products: ApiCart = await response.json()

  const items: any[] = []
  let totalFromItems = 0

  cartItemsStore.forEach(ci => {
    // Gunakan total produk utama, sudah termasuk addons & voucher
    const mainTotal = ci.total || (ci.price * ci.quantity)
    
    items.push({
      id: ci.id,
      price: mainTotal,
      quantity: 1, // setiap item sudah mewakili total
      name: ci.name,
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/products/${ci.slug}`,
      merchant_name: 'Nikhu Studio',
      category: 'Package',
      brand: 'Nikhu Studio',
       customer_name: ci.customerName,
      customer_phone: ci.customerWa,
    })

    totalFromItems += mainTotal
  })

  // gross_amount = total semua item utama
  const gross_amount = totalFromItems

  // total_quantity = jumlah produk utama
  const total_quantity = cartItemsStore.reduce((sum, ci) => sum + ci.quantity, 0)

  // orderId max 50 char
  const shortOrderId = orderId.length > 50 ? orderId.slice(0, 50) : orderId

  return {
    items,
    gross_amount,
    total_quantity,
    orderId: shortOrderId,
  }
}
