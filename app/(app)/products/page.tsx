'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { idrFormatter } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
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
    return (
      <div className="flex justify-center items-center min-h-40">
        <p className="text-gray-600">Loading products...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-6 md:mb-10 text-sm">
        <Link href="/" className="text-blue-600 hover:text-blue-800 transition-colors">
          Home
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-500">Package</span>
      </nav>

      {/* Page Title */}
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 md:mb-8">
        Package
      </h1>

      {/* Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {products.map((product) => {
          const discountRate = 0.2
          const originalPrice = product.price / (1 - discountRate)
          const formattedPrice = idrFormatter(product.price)
          const formattedOriginal = idrFormatter(originalPrice)

          return (
            <div
              key={product.id}
              className="relative group rounded-lg md:rounded-xl overflow-hidden shadow-sm bg-white hover:shadow-lg transition-all duration-300 border border-gray-100"
            >
              <Link href={`/products/${product.slug}`} className="block">
                <div className="relative aspect-square">
                  <Image
                    src={product.thumbnail}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {product.hot && (
                    <Badge className="absolute right-2 top-2 text-[10px] font-semibold bg-red-500 text-white px-2 py-1 shadow-sm">
                      🔥 HOT
                    </Badge>
                  )}
                </div>

                <div className="p-3">
                  {/* Product Name */}
                  <h3 className="font-semibold text-gray-800 group-hover:text-red-600 transition-colors duration-300 line-clamp-2 text-xs md:text-sm min-h-[2.5rem]">
                    {product.name}
                  </h3>

                  {/* Price */}
                  <div className="mt-2 flex flex-col items-start gap-1">
                    <span className="text-gray-400 text-xs line-through">
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

      {/* Empty State */}
      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products found</p>
          <p className="text-gray-400 text-sm mt-2">Check back later for new packages</p>
        </div>
      )}
    </div>
  )
}