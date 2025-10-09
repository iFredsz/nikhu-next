'use client'

import { formatDate } from '@/utils/date'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { idrFormatter } from '@/lib/utils'
import useCartStore from '@/store/cart-store'
import { toast } from 'sonner'
import { db } from '@/lib/firebase'
import { collection, query, where, collectionGroup, onSnapshot } from 'firebase/firestore'
import { useEffect, useState, useCallback, useMemo } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

type Product = {
  id: string
  name: string
  price: number
  description: string
  gallery: string[]
  slug: string
  thumbnail?: string
}

type Addon = {
  id: string
  name: string
  price: number
  type: 'fixed' | 'per_item'
  qty: number
  selectedSessions?: { [session: string]: number }
}

type Voucher = {
  code: string
  amount: number
  active: boolean
  maxUsage?: number
  currentUsage?: number
}

type BookedSession = {
  date: string
  times: string[]
}

const times = [
  "10:00","10:30","11:00","11:30",
  "12:00","12:30","13:00","13:30",
  "14:00","14:30","15:00","15:30",
  "16:00","16:30","17:00","17:30",
  "18:00","18:30","19:00","19:30",
  "20:00","20:30"
]

const BREAK_TIMES = ["12:30", "18:30"]

export default function Page({ params }: { params: { slug: string } }) {
  const { slug } = params
  const [productData, setProductData] = useState<Product | null>(null)
  const [addons, setAddons] = useState<Addon[]>([])
  const [loading, setLoading] = useState(true)
  const [voucherList, setVoucherList] = useState<Voucher[]>([])
  const [bookedSessions, setBookedSessions] = useState<BookedSession[]>([])
  const { addItemToCart } = useCartStore()

  const [date, setDate] = useState<Date | null>(null)
  const [selectedTimes, setSelectedTimes] = useState<string[]>([])
  const [people, setPeople] = useState(1)
  const [name, setName] = useState("")
  const [wa, setWa] = useState("")
  const [agree, setAgree] = useState(false)
  const [voucher, setVoucher] = useState("")
  const [discount, setDiscount] = useState(0)
  const [voucherError, setVoucherError] = useState("")
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // Realtime listener untuk produk, addons, dan vouchers
  useEffect(() => {
    const unsubscribers: (() => void)[] = []

    const setupListeners = async () => {
      try {
        // Product listener
        const productsQuery = query(collection(db, 'products'), where('slug', '==', slug))
        const unsubProduct = onSnapshot(productsQuery, (snapshot) => {
          if (!snapshot.empty) {
            const docSnap = snapshot.docs[0]
            const data = docSnap.data()
            setProductData({
              id: docSnap.id,
              name: data.name,
              price: Number(data.price),
              description: data.description || '',
              gallery: Array.isArray(data.gallery) ? data.gallery : [],
              slug: data.slug,
              thumbnail: data.thumbnail || '',
            })
          } else {
            setProductData(null)
          }
          setLoading(false)
        }, (error) => {
          console.error('Error listening to product:', error)
          setLoading(false)
        })
        unsubscribers.push(unsubProduct)

        // Addons listener
        const unsubAddons = onSnapshot(collection(db, 'addons'), (snapshot) => {
          const addonsData = snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name || 'Addon',
            price: Number(doc.data().price) || 0,
            type: (doc.data().type as 'fixed' | 'per_item') || 'fixed',
            qty: 0,
            selectedSessions: {}
          }))
          setAddons(addonsData)
        }, (error) => {
          console.error('Error listening to addons:', error)
        })
        unsubscribers.push(unsubAddons)

        // Vouchers listener
        const unsubVouchers = onSnapshot(collection(db, 'vouchers'), (snapshot) => {
          const vouchersData = snapshot.docs.map(doc => ({
            code: doc.data().code,
            amount: Number(doc.data().amount) || 0,
            active: doc.data().active !== false,
            maxUsage: Number(doc.data().maxUsage) || 100,
            currentUsage: Number(doc.data().currentUsage) || 0
          }))
          setVoucherList(vouchersData)
        }, (error) => {
          console.error('Error listening to vouchers:', error)
        })
        unsubscribers.push(unsubVouchers)

      } catch (error) {
        console.error('Error setting up listeners:', error)
        setLoading(false)
      }
    }

    setupListeners()

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [slug])

  // Realtime listener untuk booked sessions menggunakan collectionGroup
  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    const setupBookedSessionsListener = () => {
      try {
        // Menggunakan collectionGroup untuk mendengarkan semua orders dari semua users
        const ordersQuery = collectionGroup(db, 'orders')
        
        unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
          const sessionsMap = new Map<string, Set<string>>()

          snapshot.docs.forEach(orderDoc => {
            const orderData = orderDoc.data()
            
            // Hanya proses order dengan payment_status success
            if (orderData.payment_status === 'success' && 
                orderData.original_cart_items && 
                Array.isArray(orderData.original_cart_items)) {
              
              orderData.original_cart_items.forEach((cartItem: any) => {
                if (cartItem.date && cartItem.times && Array.isArray(cartItem.times)) {
                  const dateKey = cartItem.date
                  
                  if (!sessionsMap.has(dateKey)) {
                    sessionsMap.set(dateKey, new Set())
                  }
                  
                  cartItem.times.forEach((time: string) => {
                    sessionsMap.get(dateKey)?.add(time)
                  })
                }
              })
            }
          })

          // Convert Map to array
          const bookedSessionsArray: BookedSession[] = Array.from(sessionsMap.entries()).map(
            ([date, timesSet]) => ({
              date,
              times: Array.from(timesSet)
            })
          )

          setBookedSessions(bookedSessionsArray)
        }, (error) => {
          console.error('Error listening to booked sessions:', error)
        })

      } catch (error) {
        console.error('Error setting up booked sessions listener:', error)
      }
    }

    setupBookedSessionsListener()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  // Memoize booked times untuk tanggal yang dipilih
  const bookedTimesForSelectedDate = useMemo(() => {
    if (!date) return []
    
    const selectedDateStr = formatDate(date)
    const bookedSession = bookedSessions.find(session => session.date === selectedDateStr)
    
    return bookedSession ? bookedSession.times : []
  }, [date, bookedSessions])

  // Auto-remove selected times yang sudah dibooking
  useEffect(() => {
    if (!date || selectedTimes.length === 0) return

    const availableTimes = selectedTimes.filter(
      time => !bookedTimesForSelectedDate.includes(time)
    )

    if (availableTimes.length !== selectedTimes.length) {
      setSelectedTimes(availableTimes)
      toast.info("Beberapa jam yang Anda pilih baru saja dibooking oleh orang lain", {
        duration: 3000
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookedTimesForSelectedDate, date])

  // Check if a time slot is available
  const isTimeAvailable = useCallback((time: string) => {
    return !BREAK_TIMES.includes(time) && !bookedTimesForSelectedDate.includes(time)
  }, [bookedTimesForSelectedDate])

  const handleDateChange = (newDate: Date | null) => {
    setDate(newDate)
    // Reset selected times saat tanggal berubah
    setSelectedTimes([])
  }

  const handleTimeToggle = useCallback((time: string) => {
    if (!isTimeAvailable(time)) return

    setSelectedTimes(prev => {
      if (prev.includes(time)) {
        return prev.filter(t => t !== time)
      } else {
        return [...prev, time].sort((a, b) => {
          const indexA = times.indexOf(a)
          const indexB = times.indexOf(b)
          return indexA - indexB
        })
      }
    })
  }, [isTimeAvailable])

  const handleClaimVoucher = () => {
    setVoucherError("")
    const found = voucherList.find(v => v.code === voucher && v.active)
    
    if (found) {
      if (found.maxUsage && found.currentUsage && found.currentUsage >= found.maxUsage) {
        setVoucherError("Voucher sudah mencapai batas penggunaan maksimal")
        setDiscount(0)
        return
      }
      
      setDiscount(found.amount)
      toast.success(`Voucher ${voucher} berhasil diklaim! Potongan ${idrFormatter(found.amount)}`)
    } else {
      setVoucherError("Voucher tidak valid atau sudah tidak aktif")
      setDiscount(0)
    }
  }

  // Image navigation
  const nextImage = useCallback(() => {
    if (!productData) return
    const imagesToShow = productData.thumbnail 
      ? [productData.thumbnail, ...productData.gallery.filter(img => img !== productData.thumbnail)] 
      : productData.gallery
    
    setSelectedImageIndex(prev => 
      prev === imagesToShow.length - 1 ? 0 : prev + 1
    )
  }, [productData])

  const prevImage = useCallback(() => {
    if (!productData) return
    const imagesToShow = productData.thumbnail 
      ? [productData.thumbnail, ...productData.gallery.filter(img => img !== productData.thumbnail)] 
      : productData.gallery
    
    setSelectedImageIndex(prev => 
      prev === 0 ? imagesToShow.length - 1 : prev - 1
    )
  }, [productData])

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      nextImage()
    } else if (isRightSwipe) {
      prevImage()
    }

    setTouchStart(null)
    setTouchEnd(null)
  }

  // Addon handlers
  const handleAddonQtyChange = (addonId: string, delta: number) => {
    setAddons(prev =>
      prev.map(a =>
        a.id === addonId && a.type === 'per_item'
          ? { ...a, qty: Math.max(0, a.qty + delta), selectedSessions: {} }
          : a
      )
    )
  }

  const handleSessionQtyChange = (addonId: string, session: string, delta: number) => {
    setAddons(prev =>
      prev.map(a => {
        if (a.id === addonId) {
          const current = a.selectedSessions || {}
          const totalQty = Object.values(current).reduce((sum, val) => sum + val, 0)
          const maxQty = a.qty
          const newVal = Math.max(0, (current[session] || 0) + delta)
          if (totalQty + delta > maxQty) return a
          return { ...a, selectedSessions: { ...current, [session]: newVal } }
        }
        return a
      })
    )
  }

  // Calculate totals
  const addonTotal = useMemo(() => {
    return addons.reduce((sum, a) => {
      if (a.type === 'fixed') {
        return sum + (a.qty > 0 ? a.price * people * (selectedTimes.length || 1) : 0)
      } else {
        const total = Object.values(a.selectedSessions || {}).reduce((s, v) => s + v * a.price, 0)
        return sum + total
      }
    }, 0)
  }, [addons, people, selectedTimes.length])

  const total = useMemo(() => {
    const basePrice = productData ? productData.price * people * (selectedTimes.length || 1) : 0
    return basePrice + addonTotal - discount
  }, [productData, people, selectedTimes.length, addonTotal, discount])

  const handleSubmit = () => {
    if (!name || !wa || !date || selectedTimes.length === 0 || !agree) {
      toast.error("Mohon lengkapi semua data yang wajib diisi!")
      return
    }

    if (!productData) return

    // Validasi final: pastikan semua selected times masih available
    const unavailableTimes = selectedTimes.filter(time => !isTimeAvailable(time))
    if (unavailableTimes.length > 0) {
      setSelectedTimes(prev => prev.filter(time => isTimeAvailable(time)))
      toast.error("Beberapa jam yang dipilih sudah tidak tersedia. Silakan pilih jam lainnya.")
      return
    }

    // Filter only selected addons
    const selectedAddons = addons.filter(addon => 
      addon.type === 'fixed' 
        ? addon.qty > 0 
        : Object.values(addon.selectedSessions || {}).some(qty => qty > 0)
    )

    const uniqueId = `${productData.id}-${Date.now()}`

    addItemToCart({
      id: uniqueId,
      name: productData.name,
      price: productData.price,
      quantity: 1,
      date: formatDate(date),
      times: selectedTimes,
      addons: selectedAddons,
      total,
      people,
      voucherDiscount: discount,
      thumbnail: productData.thumbnail || (productData.gallery.length > 0 ? productData.gallery[0] : ''),
      slug,
      customerName: name,
      customerWa: wa,
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600">Memuat produk...</p>
        </div>
      </div>
    )
  }
  
  if (!productData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Produk Tidak Ditemukan</h1>
          <Link href="/products" className="text-indigo-600 hover:text-indigo-700">
            Kembali ke halaman produk
          </Link>
        </div>
      </div>
    )
  }

  const { name: productName, price, description, gallery, thumbnail } = productData
  const imagesToShow = thumbnail ? [thumbnail, ...gallery.filter(img => img !== thumbnail)] : gallery
  const safeSelectedImageIndex = Math.min(selectedImageIndex, Math.max(0, imagesToShow.length - 1))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li>
              <Link href="/" className="hover:text-indigo-600 transition-colors">
                Home
              </Link>
            </li>
            <li className="flex items-center">
              <span className="mx-2">/</span>
              <Link href="/products" className="hover:text-indigo-600 transition-colors">
                Package
              </Link>
            </li>
            <li className="flex items-center">
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">{productName}</span>
            </li>
          </ol>
        </nav>

        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Left Column */}
          <div className="lg:col-span-7 mb-8 lg:mb-0">
            {/* Product Images */}
            {imagesToShow.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
                <div className="flex flex-col gap-4">
                  {/* Main Image */}
                  <div className="relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden">
                    <div
                      className="w-full h-full"
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                      <Image
                        src={imagesToShow[safeSelectedImageIndex]}
                        alt={productName}
                        fill
                        className="object-cover"
                        priority
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/images/placeholder.jpg'
                        }}
                      />
                    </div>
                    
                    {/* Navigation Arrows */}
                    {imagesToShow.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105"
                          aria-label="Previous image"
                        >
                          <ChevronLeft className="w-6 h-6 text-gray-700" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105"
                          aria-label="Next image"
                        >
                          <ChevronRight className="w-6 h-6 text-gray-700" />
                        </button>
                      </>
                    )}
                  </div>
                  
                  {/* Thumbnails */}
                  {imagesToShow.length > 1 && (
                    <div className="px-4 pb-4">
                      <div className="flex gap-2 overflow-x-auto py-2">
                        {imagesToShow.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden transition-all duration-200 ${
                              safeSelectedImageIndex === index 
                                ? 'border-indigo-600 ring-2 ring-indigo-200' 
                                : 'border-gray-300 hover:border-indigo-400'
                            }`}
                          >
                            <Image
                              src={image}
                              alt={`${productName} ${index + 1}`}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = '/images/placeholder.jpg'
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Description */}
            {description && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Deskripsi Produk</h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {description}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Booking Form */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{productName}</h1>
                  <p className="text-3xl font-bold text-indigo-600">
                    {idrFormatter(price)} 
                    <span className="text-lg text-gray-600 font-normal">/sesi</span>
                  </p>
                </div>

                {/* Date Picker */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Pilih Tanggal Booking <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    selected={date}
                    onChange={handleDateChange}
                    dateFormat="dd/MM/yyyy"
                    minDate={new Date()}
                    placeholderText='Pilih tanggal booking'
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>

                {/* Time Selection */}
                {date && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Pilih Jam (Sesi) <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      Tanggal: {formatDate(date)}
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {times.map(time => {
                        const isBreak = BREAK_TIMES.includes(time)
                        const isBooked = bookedTimesForSelectedDate.includes(time)
                        const isSelected = selectedTimes.includes(time)
                        const isDisabled = isBreak || isBooked

                        return (
                          <button
                            key={time}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => handleTimeToggle(time)}
                            className={`
                              px-2 py-2 rounded-lg border-2 text-xs font-semibold transition-all duration-200
                              ${isSelected 
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md scale-105" 
                                : "bg-white text-gray-900 border-gray-300 hover:border-indigo-400 hover:bg-indigo-50"
                              }
                              ${isDisabled 
                                ? "!opacity-40 !cursor-not-allowed !bg-gray-50 !text-gray-400 !border-gray-200" 
                                : "cursor-pointer"
                              }
                            `}
                            title={
                              isBreak ? "Waktu istirahat" : 
                              isBooked ? "Sudah dibooking" : 
                              "Klik untuk pilih"
                            }
                          >
                            {time}
                          </button>
                        )
                      })}
                    </div>
                    {selectedTimes.length > 0 && (
                      <p className="text-xs text-indigo-600 mt-2 font-medium">
                        {selectedTimes.length} sesi dipilih
                      </p>
                    )}
                  </div>
                )}

                {/* Number of People */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Jumlah Orang <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <Button 
                      type="button" 
                      onClick={() => setPeople(Math.max(1, people - 1))}
                      className="w-12 h-12 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 border-0 text-xl font-bold"
                    >
                      -
                    </Button>
                    <span className="w-16 text-center text-xl font-semibold text-gray-900">{people}</span>
                    <Button 
                      type="button" 
                      onClick={() => setPeople(people + 1)}
                      className="w-12 h-12 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 border-0 text-xl font-bold"
                    >
                      +
                    </Button>
                    <span className="text-sm text-gray-600">orang</span>
                  </div>
                </div>

                {/* Addons */}
                {addons.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Opsi Tambahan
                    </label>
                    <div className="space-y-3">
                      {addons.map(addon => (
                        <div key={addon.id} className="border-2 border-gray-200 rounded-xl p-3 bg-gray-50 hover:border-gray-300 transition-colors">
                          {addon.type === 'fixed' ? (
                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={addon.qty > 0}
                                onChange={() => {
                                  setAddons(prev =>
                                    prev.map(a =>
                                      a.id === addon.id
                                        ? { ...a, qty: a.qty > 0 ? 0 : 1 }
                                        : a
                                    )
                                  )
                                }}
                                className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 mt-0.5"
                              />
                              <div className="flex-1">
                                <span className="font-medium text-gray-900 text-sm">{addon.name}</span>
                                <p className="text-xs text-gray-600 mt-1">
                                  {idrFormatter(addon.price)} / sesi / orang
                                </p>
                              </div>
                            </label>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-medium text-gray-900 text-sm">{addon.name}</span>
                                  <p className="text-xs text-gray-600">
                                    {idrFormatter(addon.price)} per item
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    onClick={() => handleAddonQtyChange(addon.id, -1)}
                                    className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 border-0 text-sm"
                                    disabled={addon.qty === 0}
                                  >
                                    -
                                  </Button>
                                  <span className="w-8 text-center font-medium text-gray-900 text-sm">{addon.qty}</span>
                                  <Button
                                    type="button"
                                    onClick={() => handleAddonQtyChange(addon.id, 1)}
                                    className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 border-0 text-sm"
                                  >
                                    +
                                  </Button>
                                </div>
                              </div>

                              {/* Session Distribution */}
                              {addon.qty > 0 && selectedTimes.length > 0 && (
                                <div className="bg-white rounded-lg p-3 border-2 border-gray-200">
                                  <p className="text-xs font-medium text-gray-900 mb-2">
                                    Distribusi item per sesi:
                                  </p>
                                  <div className="space-y-2">
                                    {selectedTimes.map(session => {
                                      const count = addon.selectedSessions?.[session] || 0
                                      return (
                                        <div key={session} className="flex items-center justify-between">
                                          <span className="text-xs text-gray-700 w-14 font-medium">{session}</span>
                                          <div className="flex items-center gap-2">
                                            <Button
                                              type="button"
                                              onClick={() => handleSessionQtyChange(addon.id, session, -1)}
                                              className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 border-0 text-xs"
                                              disabled={count === 0}
                                            >
                                              -
                                            </Button>
                                            <span className="w-6 text-center text-xs font-medium">{count}</span>
                                            <Button
                                              type="button"
                                              onClick={() => handleSessionQtyChange(addon.id, session, 1)}
                                              className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 border-0 text-xs"
                                            >
                                              +
                                            </Button>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900">Informasi Pemesan</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Lengkap <span className="text-red-500">*</span>
                    </label>
                    <input 
                      value={name} 
                      onChange={e => setName(e.target.value)}
                      placeholder="Masukkan nama lengkap"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nomor WhatsApp <span className="text-red-500">*</span>
                    </label>
                    <input 
                      value={wa} 
                      onChange={e => setWa(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {/* Voucher */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Voucher Diskon
                  </label>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input
                        value={voucher}
                        onChange={e => {
                          setVoucher(e.target.value.toUpperCase())
                          setVoucherError("")
                        }}
                        placeholder="Kode voucher (opsional)"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all uppercase"
                      />
                      {voucherError && (
                        <p className="text-red-500 text-xs mt-2 font-medium">{voucherError}</p>
                      )}
                      {discount > 0 && (
                        <p className="text-green-600 text-xs mt-2 font-medium">
                          ✓ Voucher aktif - Diskon {idrFormatter(discount)}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      onClick={handleClaimVoucher}
                      disabled={!voucher}
                      className="px-6 py-3 bg-green-500 text-white hover:bg-green-600 rounded-xl whitespace-nowrap font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Klaim
                    </Button>
                  </div>
                </div>

                {/* Agreement */}
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={agree} 
                      onChange={e => setAgree(e.target.checked)} 
                      className="h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 mt-0.5"
                    />
                    <span className="text-sm text-gray-800">
                      Saya setuju dan memahami bahwa <strong>booking yang sudah dibayar tidak dapat dibatalkan</strong> <span className="text-red-500">*</span>
                    </span>
                  </label>
                </div>

                {/* Price Summary */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border-2 border-indigo-100">
                  <h3 className="font-bold text-gray-900 mb-4 text-lg">Rincian Pembayaran</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">Harga Dasar:</span>
                      <div className="text-right">
                        <p className="text-gray-700">
                          {idrFormatter(price)} × {people} orang × {selectedTimes.length || 1} sesi
                        </p>
                        <p className="text-gray-900 font-semibold mt-1">
                          {idrFormatter(price * people * (selectedTimes.length || 1))}
                        </p>
                      </div>
                    </div>

                    {addons.filter(a => a.qty > 0 || Object.values(a.selectedSessions || {}).some(qty => qty > 0)).map(a => (
                      a.type === 'fixed' ? (
                        <div key={a.id} className="flex justify-between items-start">
                          <span className="text-gray-600">{a.name}:</span>
                          <div className="text-right">
                            <p className="text-gray-700">
                              {idrFormatter(a.price)} × {people} × {selectedTimes.length || 1}
                            </p>
                            <p className="text-gray-900 font-semibold mt-1">
                              {idrFormatter(a.price * people * (selectedTimes.length || 1))}
                            </p>
                          </div>
                        </div>
                      ) : (
                        Object.entries(a.selectedSessions || {})
                          .filter(([_, qty]) => qty > 0)
                          .map(([session, qty]) => (
                            <div key={session} className="flex justify-between items-start">
                              <span className="text-gray-600">{a.name} ({session}):</span>
                              <div className="text-right">
                                <p className="text-gray-700">
                                  {idrFormatter(a.price)} × {qty}
                                </p>
                                <p className="text-gray-900 font-semibold mt-1">
                                  {idrFormatter(a.price * qty)}
                                </p>
                              </div>
                            </div>
                          ))
                      )
                    ))}

                    {discount > 0 && (
                      <div className="flex justify-between text-green-600 font-semibold">
                        <span>Diskon Voucher:</span>
                        <span>- {idrFormatter(discount)}</span>
                      </div>
                    )}

                    <div className="border-t-2 border-indigo-200 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-indigo-600">
                          {idrFormatter(total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button 
                  onClick={handleSubmit}
                  disabled={!name || !wa || !date || selectedTimes.length === 0 || !agree}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-400"
                >
                  {!name || !wa || !date || selectedTimes.length === 0 || !agree 
                    ? "Lengkapi Data Booking" 
                    : "Booking Sekarang"
                  }
                </Button>

                {/* Info */}
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    * Data yang tersedia diupdate secara realtime
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}