'use server'

import { doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export type Product = {
  id: string
  name: string
  price: number
  slug?: string
}

export async function getProduct(slugOrId: string): Promise<Product | null> {
  try {
    // Coba ambil berdasarkan doc ID
    const productDoc = await getDoc(doc(db, 'products', slugOrId))

    if (productDoc.exists()) {
      const data = productDoc.data()
      return {
        id: productDoc.id,
        name: data.name as string,
        price: data.price as number,
        slug: data.slug as string | undefined
      }
    }

    // Jika tidak ada, coba ambil berdasarkan field slug
    const q = query(collection(db, 'products'), where('slug', '==', slugOrId))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0]
      const data = docSnap.data()
      return {
        id: docSnap.id,
        name: data.name as string,
        price: data.price as number,
        slug: data.slug as string | undefined
      }
    }

    return null
  } catch (error) {
    console.error('Error getting product:', error)
    return null
  }
}
