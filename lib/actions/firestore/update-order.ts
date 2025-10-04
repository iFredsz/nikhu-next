import { db } from "@/app/firebase"
import { doc, updateDoc } from "firebase/firestore"

export async function UpdateOrder(uid: string, orderId: string, data: any) {
  try {
    // Hapus field yang undefined sebelum update
    const cleanData: any = {}
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        cleanData[key] = data[key]
      }
    })

    const docRef = doc(db, 'users', uid, 'orders', orderId)
    await updateDoc(docRef, {
      ...cleanData,
      updated_at: new Date().toISOString()
    })

    console.log('Order updated successfully:', orderId)
    return 'update success'
  } catch (error) {
    console.error('Error updating order:', error)
    throw error
  }
}