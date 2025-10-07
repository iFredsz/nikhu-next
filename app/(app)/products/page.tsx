'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { idrFormatter } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { db } from '@/app/firebase'
import { collection, onSnapshot } from 'firebase/firestore'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  thumbnail: string
  hot?: boolean
}

export default function Page() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)

    // 🔥 Realtime listener untuk products
    const unsubscribe = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => {
          const d = doc.data()
          return {
            id: doc.id,
            name: d.name || '',
            slug: d.slug || '',
            price: d.price || 0,
            thumbnail: d.thumbnail || '',
            hot: !!d.hot,
          }
        }) as Product[]
        setProducts(data)
        setLoading(false)
      },
      (error) => {
        console.error('Error fetching products:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  if (loading) {
    return <p className="text-center mt-10">Loading products...</p>
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="flex gap-4 mt-5 mb-10 md:mt-0">
        <Link href="/">Home</Link>
        <span>/</span>
        <p className="text-gray-500">Package</p>
      </div>

      <h2 className="mb-4 md:mb-8 font-bold text-2xl">Package</h2>

      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {products.map((product) => {
          const discountRate = 0.2
          const originalPrice = product.price / (1 - discountRate)
          const formattedPrice = idrFormatter(product.price)
          const formattedOriginal = idrFormatter(originalPrice)

          return (
            <div
              key={product.id}
              className="relative group rounded-xl overflow-hidden shadow-md bg-white hover:shadow-xl transition-all duration-300"
            >
              <Link href={`/products/${product.slug}`}>
                <div className="relative">
                  <Image
                    src={product.thumbnail}
                    width={350}
                    height={350}
                    alt={product.name}
                    className="object-cover w-full h-48 md:h-56 group-hover:scale-105 transition-transform duration-500"
                  />
                  {product.hot && (
                    <Badge className="absolute right-2 top-2 text-[10px] font-semibold bg-red-500 text-white px-2 py-1 shadow-sm">
                      🔥 HOT
                    </Badge>
                  )}
                </div>

                <div className="p-3 text-center">
                  <p className="mb-2 text-sm md:text-lg font-semibold text-gray-800 group-hover:text-red-600 transition-colors duration-300">
                    {product.name}
                  </p>

                  {/* Harga */}
                  <div className="flex justify-center items-center gap-2">
                    <span className="text-gray-400 text-xs md:text-sm line-through">
                      {formattedOriginal}
                    </span>
                    <span className="text-red-600 font-bold text-sm md:text-base">
                      {formattedPrice}
                    </span>
                  </div>

                </div>
              </Link>
            </div>
          )
        })}
      </div>
    </>
  )
}
