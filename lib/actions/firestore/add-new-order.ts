import { db } from "@/app/firebase"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { Midtrans_Checkout_Data } from "../midtrans/generate-checkout-data"

export async function addNewOrder(uid: string, checkoutData: Midtrans_Checkout_Data & { orderId: string }) {
  try {
    const docRef = doc(db, 'users', uid, 'orders', checkoutData.orderId)
    await setDoc(docRef, {
      date: serverTimestamp(),
      payment_status: 'pending',
      ...checkoutData,
    })

    return checkoutData.orderId
  } catch (error) {
    console.log('Error adding new order:', error)
    throw error
  }
}