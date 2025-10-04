import { db } from "@/app/firebase"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { Midtrans_Checkout_Data } from "../midtrans/generate-checkout-data"
import { CartItemsStore } from "@/store/cart-store"
import { cleanData } from '@/lib/clean-data'

export async function addNewOrder(uid: string, checkoutData: Midtrans_Checkout_Data & { originalCartItems: CartItemsStore[] }) {
  try {
    console.log('UID:', uid)
    console.log('Adding order to Firestore...')

    // Pastikan path collection benar
    const ordersCollection = collection(db, 'users', uid, 'orders')
    
    // Buat object data tanpa field undefined menggunakan cleanData
    const orderData = cleanData({
      date: serverTimestamp(),
      created_at: new Date().toISOString(),
      payment_status: 'pending',
      
      // Simpan semua data original dari cart
      original_cart_items: checkoutData.originalCartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        date: item.date,
        times: item.times || [],
        addons: item.addons || [],
        total: item.total,
        people: item.people || 1,
        voucherDiscount: item.voucherDiscount || 0,
        thumbnail: item.thumbnail || '',
        slug: item.slug || '',
        customerName: item.customerName || '',
        customerWa: item.customerWa || '',
      })),
      
      // Data untuk Midtrans
      midtrans_items: checkoutData.items,
      gross_amount: checkoutData.gross_amount,
      total_quantity: checkoutData.total_quantity,
      
      // Summary info
      customer_name: checkoutData.originalCartItems[0]?.customerName || '',
      customer_wa: checkoutData.originalCartItems[0]?.customerWa || '',
      total_sessions: checkoutData.originalCartItems.reduce((total, item) => total + (item.times?.length || 0), 0),
      total_people: checkoutData.originalCartItems.reduce((total, item) => total + (item.people || 1), 0),
      
      // Hanya tambahkan order_id jika tidak undefined
      ...(checkoutData.orderId && { order_id: checkoutData.orderId })
    })

    console.log('Order data to save:', orderData)
    
    const docRef = await addDoc(ordersCollection, orderData)
    console.log('Order document created with ID:', docRef.id)
    
    return docRef.id
    
  } catch (error) {
    console.error('Error adding new order:', error)
    throw error
  }
}