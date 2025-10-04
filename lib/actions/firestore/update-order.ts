import { db } from "@/app/firebase"
import { doc, updateDoc } from "firebase/firestore"

export async function UpdateOrder(uid: string, orderId: string, data: {}) {
  try {
    const docRef = doc(db, 'users', uid, 'orders', orderId)
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    })
    return 'update success'
  } catch (error) {
    console.error('Error updating order:', error)
    throw error
  }
}