import { db } from "@/app/firebase"
import { doc, setDoc } from "firebase/firestore" // ✅ Import setDoc

export async function UpdateOrder(uid: string, orderId: string, data: {}) {
  try {
    const docRef = doc(db, 'users', uid, 'orders', orderId)
    
    // ✅ Gunakan setDoc dengan merge: true (create or update)
    await setDoc(docRef, {
      ...data,
      updated_at: new Date()
    }, { merge: true }) // ✅ Ini yang penting!
    
    console.log(`✅ Successfully updated order: ${orderId}`)
    return 'update success'
    
  } catch (error) {
    console.error('❌ Error in UpdateOrder:', error)
    return error
  }
}