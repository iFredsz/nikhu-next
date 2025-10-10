// lib/actions/firestore/get-order.ts
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

export async function getOrder(uid: string, orderId: string) {
  try {
    const docRef = doc(db, 'users', uid, 'orders', orderId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data()
      
      // Transform data dari Firestore ke format yang diharapkan komponen
      const originalCartItems = data.original_cart_items || []
      
      // Buat items array yang kompatibel
      const items = originalCartItems.map((item: any, index: number) => ({
        id: item.id || `item-${index}`,
        name: item.name || 'Unknown Product',
        price: item.total || item.price || 0,
        quantity: 1,
        thumbnail: item.thumbnail,
        slug: item.slug,
      }))

      // PERBAIKAN: Gunakan updated_at atau created_at jika date adalah serverTimestamp
      let displayDate = data.date
      if (data.date && data.date._methodName === 'serverTimestamp') {
        displayDate = data.updated_at || data.created_at
      }

      return {
        bookingDetails: originalCartItems,
        items: items,
        payment_status: data.payment_status || 'pending',
        total_quantity: data.total_quantity || originalCartItems.length,
        token: data.token,
        date: displayDate,
        gross_amount: data.gross_amount,
        order_id: orderId,
        created_at: data.created_at,
        updated_at: data.updated_at,
      }
    } else {
      return null
    }
  } catch (error) {
    console.error('Error getting order:', error)
    throw error
  }
}