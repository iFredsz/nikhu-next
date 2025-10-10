'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getOrder } from '@/lib/actions/firestore/get-order'
import { getProduct, Product } from '@/lib/actions/firestore/get-product'
import { firestoreDateFormatter, idrFormatter } from '@/lib/utils'
import OrderEmptyPlaceholder from './OrderEmptyPlaceholder'
import OrderStatus from '../OrderStatus'
import MidtransPayment from './MidtransPayment'
import OrderSuccessPlaceholder from './OrderSuccessPlaceholder'
import LoadingText from '@/components/LoadingText'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import DownloadReceipt from './DownloadReceipt'
import { useEffect, useState, useCallback } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

type Props = {
  order_id: string
  uid: string
}

type ProductData = {
  price: number
  name: string
}

type OrderItemType = {
  id: string
  name: string
  price: number
  quantity: number
  thumbnail?: string
  url?: string
  selectedSessions?: { [key: string]: number }
  slug?: string
}

type OrderData = {
  bookingDetails?: any[]
  items?: OrderItemType[]
  payment_status: string
  total_quantity: number
  token?: string
  date: any
  gross_amount?: number
  order_id?: string
  created_at?: any
  updated_at?: any
}

export default function OrderContainer({ order_id, uid }: Props) {
  const [productsData, setProductsData] = useState<{ [key: string]: ProductData }>({})
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['order', { order_id, uid }],
    queryFn: async () => {
      console.log('=== FETCHING ORDER ===')
      console.log('Order ID:', order_id)
      console.log('User ID:', uid)
      
      const order = await getOrder(uid, order_id)
      console.log('Order data received:', order)
      
      return order
    },
  })

  // REALTIME LISTENER - untuk payment_status, token, dan field penting lainnya
  useEffect(() => {
    console.log('🔄 Setting up realtime listener for payment status')
    
    const orderRef = doc(db, 'users', uid, 'orders', order_id)
    
    const unsubscribe = onSnapshot(orderRef, (snapshot) => {
      if (snapshot.exists()) {
        const updatedData = snapshot.data()
        console.log('🔥 ORDER UPDATED REALTIME')
        console.log('   Payment Status:', updatedData.payment_status)
        console.log('   Token:', updatedData.token)
        
        // Update React Query cache - FULL UPDATE untuk memastikan semua field terupdate
        queryClient.setQueryData(['order', { order_id, uid }], (oldData: any) => {
          if (!oldData) return updatedData
          
          // Full merge dengan priority ke data baru
          const mergedData = {
            ...oldData,
            ...updatedData,  // Override dengan data terbaru
            // Preserve bookingDetails jika tidak ada di updatedData
            bookingDetails: updatedData.bookingDetails || oldData.bookingDetails,
            items: updatedData.items || oldData.items,
          }
          
          console.log('   Merged data:', mergedData)
          return mergedData
        })
      }
    }, (error) => {
      console.error('❌ Error in order listener:', error)
    })

    return () => {
      console.log('🧹 Cleanup order listener')
      unsubscribe()
    }
  }, [order_id, uid, queryClient])

  const orderData = data as OrderData | undefined

  // Fetch products - TETAP PAKAI LOGIC ORIGINAL (sequential)
  const fetchProducts = useCallback(async (bookingDetails: any[]) => {
    console.log('Fetching products for booking details...')
    
    const products: { [key: string]: ProductData } = {}

    for (const item of bookingDetails) {
      try {
        const product: Product | null = await getProduct(item.slug || item.id)
        if (product) {
          products[item.name] = {
            price: product.price,
            name: product.name,
          }
        }
      } catch (error) {
        console.error(`Error fetching product ${item.name}:`, error)
      }
    }

    console.log('Products data:', products)
    setProductsData(products)
  }, [])

  useEffect(() => {
    console.log('=== ORDER DATA UPDATED ===')
    console.log('Order data:', orderData)
    
    if (orderData?.bookingDetails && orderData.bookingDetails.length > 0) {
      fetchProducts(orderData.bookingDetails)
    }
  }, [orderData, fetchProducts])

  if (isLoading) {
    return (
      <div className="flex w-full justify-center pt-8">
        <LoadingText />
      </div>
    )
  }

  if (isError) {
    return <p>Terjadi kesalahan saat mengambil order.</p>
  }

  if (!orderData) {
    console.log('No order data found')
    return <OrderEmptyPlaceholder />
  }

  console.log('=== RENDERING ORDER CONTAINER ===')
  console.log('Order data for rendering:', orderData)
  console.log('🔍 Current payment_status:', orderData.payment_status)
  console.log('🔍 Has token:', !!orderData.token)

  const { 
    bookingDetails = [], 
    items = [], 
    payment_status, 
    total_quantity, 
    token, 
    date, 
    gross_amount,
    created_at,
    updated_at 
  } = orderData
  
  // OPTIMIZED DATE HANDLING - sama seperti di OrdersCard
  let displayDate = date
  if (date && date._methodName === 'serverTimestamp') {
    displayDate = updated_at || created_at
  }
  
  const formattedDate = firestoreDateFormatter(displayDate)

  console.log('Items array:', items)
  console.log('Items is array?', Array.isArray(items))
  
  const totalOrderNumber = Array.isArray(items) 
    ? items.reduce((acc: number, item: OrderItemType) => {
        const itemPrice = item.price || 0
        const itemQuantity = item.quantity || 1
        return acc + itemPrice * itemQuantity
      }, 0)
    : gross_amount || 0

  const totalOrder = idrFormatter(totalOrderNumber)

  const displayItems = (bookingDetails && bookingDetails.length > 0) ? bookingDetails : items

  console.log('Display items:', displayItems)
  console.log('Total order number:', totalOrderNumber)

  return (
    <>
      <h4 className="mb-4">Product Details</h4>

      {/* Tombol Download Receipt */}
      {payment_status === 'success' && (
        <div className="mb-4">
          <DownloadReceipt orderData={orderData} orderId={order_id} />
        </div>
      )}

      {/* Booking Details */}
      {displayItems && displayItems.length > 0 ? (
        displayItems.map((b: any, idx: number) => {
          console.log('Rendering booking item:', b)
          
          const productData = productsData[b.name]
          const baseProductPrice = productData?.price || b.price || 0

          const sessionCount = b.times?.length || 1
          const peopleCount = b.people || 1
          const productTotal = baseProductPrice * peopleCount * sessionCount

          const addonsTotal =
            (b.addons && Array.isArray(b.addons)) 
              ? b.addons.reduce((acc: number, addon: any) => {
                  if (addon.type === 'fixed' && (addon.qty as number) > 0) {
                    return acc + addon.price * peopleCount * sessionCount
                  } else if (addon.type === 'per_item' && addon.selectedSessions) {
                    return (
                      acc +
                      Object.values(addon.selectedSessions).reduce(
                        (sessionAcc: number, qty) =>
                          sessionAcc + addon.price * (qty as number),
                        0
                      )
                    )
                  }
                  return acc
                }, 0)
              : 0

          const subtotal = productTotal + addonsTotal
          const finalTotal = b.total || subtotal - (b.voucherDiscount || 0)

          return (
            <Card key={idx} className="mb-4">
              <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-md">{b.name}</p>
                    <div className="text-sm text-gray-600 mt-1 space-y-1">
                      {b.customerName && <p>Nama: {b.customerName}</p>}
                      {b.customerWa && <p>WhatsApp: {b.customerWa}</p>}
                      {b.date && <p>Tanggal booking: {b.date}</p>}
                      {b.times && b.times.length > 0 && (
                        <div>
                          <p>Sesi:</p>
                          <ul className="ml-4 list-disc">
                            {b.times.map((time: string, index: number) => (
                              <li key={index}>{time}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {b.people && <p>Jumlah orang: {b.people}</p>}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-800">Detail Harga:</p>
                  <ul className="text-xs text-gray-600 mt-1 space-y-1">
                    {/* Harga Produk Dasar */}
                    <li className="flex flex-col mb-1">
                      <div className="flex justify-between">
                        <span>
                          • {b.name} - {idrFormatter(baseProductPrice)} × {peopleCount} orang × {sessionCount} sesi
                        </span>
                        <span>{idrFormatter(productTotal)}</span>
                      </div>
                    </li>

                    {/* Addons */}
                    {b.addons && Array.isArray(b.addons) &&
                      b.addons
                        .map((addon: any, index: number) => {
                          if (addon.type === 'fixed' && (addon.qty as number) > 0) {
                            const addonSubtotal = addon.price * peopleCount * sessionCount
                            return (
                              <li key={index} className="flex justify-between">
                                <span>
                                  • {addon.name} - {idrFormatter(addon.price)} × {peopleCount} orang × {sessionCount} sesi
                                </span>
                                <span>{idrFormatter(addonSubtotal)}</span>
                              </li>
                            )
                          } else if (addon.type === 'per_item' && addon.selectedSessions) {
                            return Object.entries(addon.selectedSessions)
                              .filter(([_, qty]) => (qty as number) > 0)
                              .map(([session, qty], i) => (
                                <li key={`${index}-${session}`} className="flex justify-between">
                                  <span>
                                    • {addon.name} ({session}) - {idrFormatter(addon.price)} × {qty}
                                  </span>
                                  <span>{idrFormatter(addon.price * (qty as number))}</span>
                                </li>
                              ))
                          }
                          return null
                        })
                        .flat()
                        .filter(Boolean)}
                  </ul>
                </div>

                <div className="mt-2 flex justify-between text-sm border-t border-gray-200 pt-2">
                  <span className="font-medium">Subtotal:</span>
                  <span className="font-medium">{idrFormatter(subtotal)}</span>
                </div>

                {b.voucherDiscount > 0 && (
                  <div className="mt-1 flex justify-between text-sm">
                    <span className="text-green-600">Diskon Voucher:</span>
                    <span className="text-green-600 font-semibold">
                      -{idrFormatter(b.voucherDiscount)}
                    </span>
                  </div>
                )}

                <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-lg">{idrFormatter(finalTotal)}</span>
                </div>
              </CardContent>
            </Card>
          )
        })
      ) : (
        <p>Belum ada booking details.</p>
      )}

      <h4 className="mb-4">Payment Details</h4>
      <div className="mb-2 flex justify-between">
        <p>Payment Status</p>
        <OrderStatus status={payment_status} />
      </div>

      <div className="mb-2 flex justify-between">
        <p>Total Amount</p>
        <p className="font-bold">{totalOrder}</p>
      </div>

      <div className="mb-2 flex justify-between">
        <p>Order Date</p>
        <p>{formattedDate}</p>
      </div>

      {/* REALTIME: Payment status success */}
      {payment_status === 'success' && <OrderSuccessPlaceholder />}

      {/* REALTIME: Show payment button - Support pending dan status lainnya */}
      {(payment_status === 'pending' || 
        (payment_status !== 'success' && payment_status !== 'failure')) && 
        token && (
        <MidtransPayment 
          key={`payment-${payment_status}-${token}`}
          token={token} 
          order_id={order_id} 
          uid={uid} 
        />
      )}

      {(payment_status === 'pending' || 
        (payment_status !== 'success' && payment_status !== 'failure')) && 
        !token && (
        <p className="text-yellow-600">Menunggu token pembayaran...</p>
      )}

      {/* Status failure */}
      {payment_status === 'failure' && (
        <div className="my-8 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-semibold text-center">
            ❌ Pembayaran gagal
          </p>
          <p className="text-red-600 text-sm text-center mt-2">
            Silakan coba lagi atau hubungi customer service.
          </p>
        </div>
      )}
    </>
  )
}