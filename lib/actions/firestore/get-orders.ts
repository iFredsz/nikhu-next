// lib/actions/firestore/get-orders.ts
import { db } from "@/lib/firebase"
import { collection, getDocs, query, orderBy } from "firebase/firestore"

export async function getOrders(uid: string): Promise<any[]> {
  try {
    console.log('=== GETTING ORDERS ===')
    console.log('User ID:', uid)
    
    // Validasi UID
    if (!uid || typeof uid !== 'string' || uid.trim() === '') {
      console.error('Invalid UID:', uid)
      return []
    }

    // Validasi db
    if (!db) {
      console.error('Firestore db is not initialized')
      return []
    }

    console.log('Firestore db initialized:', !!db)
    
    try {
      // Pastikan path collection benar
      const ordersCollection = collection(db, 'users', uid, 'orders')
      console.log('Orders collection created successfully')
      
      const q = query(ordersCollection, orderBy('created_at', 'desc'))
      const querySnapshot = await getDocs(q)

      console.log('Number of orders found:', querySnapshot.docs.length)

      const orders = querySnapshot.docs.map(doc => {
        const data = doc.data()
        console.log('Raw order data for', doc.id, ':', data)
        
        // Transform data
        const originalCartItems = data.original_cart_items || []
        const items = originalCartItems.map((item: any, index: number) => ({
          id: item.id || `item-${index}`,
          name: item.name || 'Unknown Product',
          price: item.total || item.price || 0,
          quantity: item.quantity || 1,
          thumbnail: item.thumbnail,
          slug: item.slug,
        }))

        // PERBAIKAN: Gunakan updated_at atau created_at jika date adalah serverTimestamp
        let displayDate = data.date
        if (data.date && data.date._methodName === 'serverTimestamp') {
          displayDate = data.updated_at || data.created_at
          console.log('Using fallback date for order', doc.id, ':', displayDate)
        }

        const orderData = {
          bookingDetails: originalCartItems,
          items: items,
          payment_status: data.payment_status || 'pending',
          total_quantity: data.total_quantity || originalCartItems.length,
          token: data.token,
          date: displayDate, // Gunakan date yang sudah diperbaiki
          gross_amount: data.gross_amount || 0,
          order_id: doc.id,
          customer_name: data.customer_name,
          customer_wa: data.customer_wa,
          created_at: data.created_at,
          updated_at: data.updated_at,
        }

        console.log('Transformed order data:', orderData)
        return orderData
      })

      console.log('=== FINAL ORDERS DATA ===')
      console.log('Total orders:', orders.length)
      
      return orders
    } catch (firestoreError) {
      console.error('Firestore operation error:', firestoreError)
      return []
    }
    
  } catch (error) {
    console.error('Error getting orders:', error)
    return []
  }
}