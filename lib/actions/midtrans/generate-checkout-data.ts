import { CartItemsStore } from '@/store/cart-store'

export type Midtrans_Checkout_Data = {
  items: any[]
  gross_amount: number
  total_quantity: number
  orderId?: string
  originalCartItems: CartItemsStore[]
}

export async function generateCheckoutData(
  cartItemsStore: CartItemsStore[],
  orderId?: string
): Promise<Midtrans_Checkout_Data> {
  const items: any[] = []
  const originalCartItems: CartItemsStore[] = []
  let gross_amount = 0
  let total_quantity = 0

  cartItemsStore.forEach((cartItem) => {
    // Simpan data original (bersihkan undefined)
    originalCartItems.push({
      id: cartItem.id,
      name: cartItem.name || 'Unknown Product',
      price: cartItem.price || 0,
      quantity: cartItem.quantity || 1,
      total: cartItem.total || 0,
      date: cartItem.date || '',
      times: cartItem.times || [],
      people: cartItem.people || 1,
      addons: cartItem.addons || [],
      voucherDiscount: cartItem.voucherDiscount || 0,
      thumbnail: cartItem.thumbnail || '',
      slug: cartItem.slug || '',
      customerName: cartItem.customerName || '',
      customerWa: cartItem.customerWa || '',
    })

    // Format untuk Midtrans
    const itemTotal = cartItem.total || 0
    
    items.push({
      id: cartItem.id,
      name: cartItem.name || 'Unknown Product',
      price: itemTotal,
      quantity: 1,
      category: 'Booking',
      merchant_name: 'NIKHU STUDIO',
    })

    gross_amount += itemTotal
    total_quantity += 1
  })

  // Hanya return orderId jika ada
  const result: Midtrans_Checkout_Data = {
    items,
    gross_amount,
    total_quantity,
    originalCartItems,
  }

  if (orderId) {
    result.orderId = orderId
  }

  return result
}