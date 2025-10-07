'use client'

import { formatDate } from '@/utils/date'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { idrFormatter } from '@/lib/utils'
import useCartStore from '@/store/cart-store'
import { toast } from 'sonner'
import { db } from '@/app/firebase'
import { collection, query, where, getDocs, onSnapshot, doc } from 'firebase/firestore'
import { useEffect, useState, useCallback } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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

  // Realtime listener untuk produk
  useEffect(() => {
    let unsubscribeProduct: () => void
    let unsubscribeAddons: () => void
    let unsubscribeVouchers: () => void

    const setupRealtimeListeners = async () => {
      try {
        // Realtime listener untuk produk
        const productsQuery = query(collection(db, 'products'), where('slug', '==', slug))
        
        unsubscribeProduct = onSnapshot(productsQuery, (querySnapshot) => {
          if (!querySnapshot.empty) {
            const docSnap = querySnapshot.docs[0]
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
        })

        // Realtime listener untuk addons
        unsubscribeAddons = onSnapshot(collection(db, 'addons'), (snapshot) => {
          const addonsData = snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name || 'Addon',
            price: Number(doc.data().price) || 0,
            type: (doc.data().type as 'fixed' | 'per_item') || 'fixed',
            qty: 0,
            selectedSessions: {}
          }))
          setAddons(addonsData)
        })

        // Realtime listener untuk vouchers
        unsubscribeVouchers = onSnapshot(collection(db, 'vouchers'), (snapshot) => {
          const vouchersData = snapshot.docs.map(doc => ({
            code: doc.data().code,
            amount: Number(doc.data().amount) || 0,
            active: doc.data().active !== false,
            maxUsage: Number(doc.data().maxUsage) || 100,
            currentUsage: Number(doc.data().currentUsage) || 0
          }))
          setVoucherList(vouchersData)
        })

      } catch (error) {
        console.error('Error setting up realtime listeners:', error)
        setLoading(false)
      }
    }

    setupRealtimeListeners()

    // Cleanup function
    return () => {
      if (unsubscribeProduct) unsubscribeProduct()
      if (unsubscribeAddons) unsubscribeAddons()
      if (unsubscribeVouchers) unsubscribeVouchers()
    }
  }, [slug])

  // Realtime listener untuk booked sessions
  useEffect(() => {
    let unsubscribeUsers: () => void

    const setupBookedSessionsListener = async () => {
      try {
        // Listen untuk perubahan di collection users
        unsubscribeUsers = onSnapshot(collection(db, 'users'), async (usersSnapshot) => {
          const allBookedSessions: BookedSession[] = []

          // Untuk setiap user, listen orders mereka
          for (const userDoc of usersSnapshot.docs) {
            const ordersRef = collection(db, 'users', userDoc.id, 'orders')
            
            // Setup listener untuk orders setiap user
            onSnapshot(ordersRef, (ordersSnapshot) => {
              ordersSnapshot.forEach(orderDoc => {
                const orderData = orderDoc.data()
                if (orderData.payment_status === 'success' && 
                    orderData.original_cart_items && 
                    orderData.original_cart_items.length > 0) {
                  
                  const cartItem = orderData.original_cart_items[0]
                  if (cartItem.date && cartItem.times && Array.isArray(cartItem.times)) {
                    // Cek apakah session sudah ada di array
                    const existingSessionIndex = allBookedSessions.findIndex(
                      session => session.date === cartItem.date
                    )
                    
                    if (existingSessionIndex !== -1) {
                      // Merge times jika date sudah ada
                      const existingTimes = allBookedSessions[existingSessionIndex].times
                      const newTimes = Array.from(new Set([...existingTimes, ...cartItem.times]))
                      allBookedSessions[existingSessionIndex].times = newTimes
                    } else {
                      // Tambah session baru
                      allBookedSessions.push({
                        date: cartItem.date,
                        times: cartItem.times
                      })
                    }
                  }
                }
              })
              
              // Update state dengan data terbaru
              setBookedSessions([...allBookedSessions])
            })
          }
        })

      } catch (error) {
        console.error('Error setting up booked sessions listener:', error)
      }
    }

    setupBookedSessionsListener()

    return () => {
      if (unsubscribeUsers) unsubscribeUsers()
    }
  }, [])

  // Check if a time slot is booked
  const isTimeBooked = (time: string) => {
    if (!date) return false
    
    const selectedDateStr = formatDate(date)
    const bookedSession = bookedSessions.find(session => 
      session.date === selectedDateStr && session.times.includes(time)
    )
    
    return !!bookedSession
  }

  const handleClaimVoucher = () => {
    setVoucherError("")
    const found = voucherList.find(v => v.code === voucher && v.active)
    
    if (found) {
      // Check if voucher has reached max usage
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

  // Navigation functions
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

  // Touch handlers for swipe
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Memuat produk...</p>
      </div>
    </div>
  )
  
  if (!productData) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Produk Tidak Ditemukan</h1>
        <Link href="/products" className="text-indigo-600 hover:text-indigo-700">
          Kembali ke halaman produk
        </Link>
      </div>
    </div>
  )

  const { id, name: productName, price, description, gallery, thumbnail } = productData
  const imagesToShow = thumbnail ? [thumbnail, ...gallery.filter(img => img !== thumbnail)] : gallery

  // Validasi selectedImageIndex agar tidak melebihi jumlah gambar
  const safeSelectedImageIndex = Math.min(selectedImageIndex, imagesToShow.length - 1)

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

  const addonTotal = addons.reduce((sum, a) => {
    if (a.type === 'fixed') {
      return sum + (a.qty > 0 ? a.price * people * (selectedTimes.length || 1) : 0)
    } else {
      const total = Object.values(a.selectedSessions || {}).reduce((s, v) => s + v * a.price, 0)
      return sum + total
    }
  }, 0)

  const total = price * people * (selectedTimes.length || 1) + addonTotal - discount

  const handleSubmit = () => {
    if (!name || !wa || !date || selectedTimes.length === 0 || !agree) {
      toast.error("Mohon lengkapi semua data yang wajib diisi!")
      return
    }

    // Filter hanya addons yang dipilih
    const selectedAddons = addons.filter(addon => 
      addon.type === 'fixed' 
        ? addon.qty > 0 
        : Object.values(addon.selectedSessions || {}).some(qty => qty > 0)
    )

    // Buat ID unik untuk setiap booking
    const uniqueId = `${id}-${Date.now()}`

    addItemToCart({
      id: uniqueId,
      name: productName,
      price,
      quantity: 1, // SELALU 1 untuk setiap booking
      date: formatDate(date),
      times: selectedTimes,
      addons: selectedAddons,
      total,
      people,
      voucherDiscount: discount,
      thumbnail: thumbnail || (gallery.length > 0 ? gallery[0] : ''),
      slug,
      customerName: name,
      customerWa: wa,
    })


  }

  return (
    <div className="min-h-screen">
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
          {/* Product Images & Description - Left Column */}
          <div className="lg:col-span-7 mb-8 lg:mb-0">
            {/* Product Images with Thumbnail Gallery */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
              <div className="flex flex-col gap-4">
                {/* Main Image with Navigation */}
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
                        // Fallback jika gambar error
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
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105"
                      >
                        <ChevronLeft className="w-6 h-6 text-gray-700" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105"
                      >
                        <ChevronRight className="w-6 h-6 text-gray-700" />
                      </button>
                    </>
                  )}
                </div>
                
                {/* Thumbnail Gallery */}
                {imagesToShow.length > 1 && (
                  <div className="px-4 pb-4">
                    <div className="flex gap-2 overflow-x-auto py-2">
                      {imagesToShow.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden transition-all duration-200 ${
                            safeSelectedImageIndex === index 
                              ? 'border-indigo-600 ring-2 ring-indigo-600 ring-opacity-20' 
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <Image
                            src={image}
                            alt={`${productName} ${index + 1}`}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback jika thumbnail error
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
            
            {/* Product Description */}
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

          {/* Booking Form - Right Column */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-6">
              <div className="space-y-6">
                {/* Product Header */}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{productName}</h1>
                  <p className="text-3xl font-bold text-indigo-600">{idrFormatter(price)} <span className="text-lg text-gray-600">/sesi</span></p>
                </div>

                {/* Date Picker */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Pilih Tanggal Booking
                  </label>
                  <DatePicker
                    selected={date}
                    onChange={d => setDate(d)}
                    dateFormat="dd/MM/yyyy"
                    minDate={new Date()}
                    placeholderText='Pilih tanggal booking'
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  />
                </div>

                {/* Time Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Pilih Jam (Sesi) {date && `- ${formatDate(date)}`}
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {times.map(time => {
                      const isBooked = isTimeBooked(time)
                      const isBreak = time === "12:30" || time === "18:30"
                      const isSelected = selectedTimes.includes(time)
                      const isDisabled = isBooked || isBreak

                      return (
                        <button
                          key={time}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => {
                            setSelectedTimes(prev =>
                              prev.includes(time) 
                                ? prev.filter(t => t !== time)
                                : [...prev, time]
                            )
                          }}
                          className={`
                            px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200
                            ${isSelected 
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-md" 
                              : "bg-white text-gray-900 border-gray-300 hover:border-indigo-400 hover:shadow-sm"
                            }
                            ${isDisabled 
                              ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200" 
                              : ""
                            }
                          `}
                          title={isBooked ? "Sudah dibooking" : isBreak ? "Waktu istirahat" : ""}
                        >
                          {time}
                          {isBreak && " ⏸"}
                        </button>
                      )
                    })}
                  </div>
                  {date && bookedSessions.some(session => session.date === formatDate(date)) && (
                    <p className="text-xs text-gray-500 mt-2">
                      * Slot waktu yang sudah dipesan ditandai dengan opacity lebih rendah
                    </p>
                  )}
                </div>

                {/* Number of People */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Jumlah Orang
                  </label>
                  <div className="flex items-center gap-3">
                    <Button 
                      type="button" 
                      onClick={() => setPeople(Math.max(1, people - 1))}
                      className="w-12 h-12 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 border-0 text-lg font-bold"
                    >
                      -
                    </Button>
                    <span className="w-12 text-center text-lg font-semibold text-gray-900">{people}</span>
                    <Button 
                      type="button" 
                      onClick={() => setPeople(people + 1)}
                      className="w-12 h-12 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 border-0 text-lg font-bold"
                    >
                      +
                    </Button>
                    <span className="text-sm text-gray-600 ml-2">orang</span>
                  </div>
                </div>

                {/* Addons */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Opsi Tambahan
                  </label>
                  <div className="space-y-3">
                    {addons.map(addon => (
                      <div key={addon.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
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
                              className="h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 mt-0.5"
                            />
                            <div className="flex-1">
                              <span className="font-medium text-gray-900">{addon.name}</span>
                              <p className="text-sm text-gray-600 mt-1">
                                {idrFormatter(addon.price)} / sesi / orang
                              </p>
                            </div>
                          </label>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-medium text-gray-900">{addon.name}</span>
                                <p className="text-sm text-gray-600">
                                  {idrFormatter(addon.price)} per item
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  onClick={() => handleAddonQtyChange(addon.id, -1)}
                                  className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 border-0"
                                  disabled={addon.qty === 0}
                                >
                                  -
                                </Button>
                                <span className="w-8 text-center font-medium text-gray-900">{addon.qty}</span>
                                <Button
                                  type="button"
                                  onClick={() => handleAddonQtyChange(addon.id, 1)}
                                  className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 border-0"
                                >
                                  +
                                </Button>
                              </div>
                            </div>

                            {/* Session Distribution */}
                            {addon.qty > 0 && selectedTimes.length > 0 && (
                              <div className="bg-white rounded-lg p-3 border">
                                <p className="text-sm font-medium text-gray-900 mb-2">
                                  Distribusi item per sesi:
                                </p>
                                <div className="space-y-2">
                                  {selectedTimes.map(session => {
                                    const count = addon.selectedSessions?.[session] || 0
                                    return (
                                      <div key={session} className="flex items-center justify-between">
                                        <span className="text-sm text-gray-700 w-16">{session}</span>
                                        <div className="flex items-center gap-2">
                                          <Button
                                            type="button"
                                            onClick={() => handleSessionQtyChange(addon.id, session, -1)}
                                            className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 border-0 text-xs"
                                            disabled={count === 0}
                                          >
                                            -
                                          </Button>
                                          <span className="w-6 text-center text-sm font-medium">{count}</span>
                                          <Button
                                            type="button"
                                            onClick={() => handleSessionQtyChange(addon.id, session, 1)}
                                            className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 border-0 text-xs"
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
                    {addons.length === 0 && (
                      <p className="text-center text-gray-500 py-4">Tidak ada opsi tambahan tersedia</p>
                    )}
                  </div>
                </div>

                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900">Informasi Pemesan</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Lengkap *
                    </label>
                    <input 
                      value={name} 
                      onChange={e => setName(e.target.value)}
                      placeholder="Masukkan nama lengkap"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nomor WhatsApp *
                    </label>
                    <input 
                      value={wa} 
                      onChange={e => setWa(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>

                {/* Agreement */}
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={agree} 
                      onChange={e => setAgree(e.target.checked)} 
                      className="h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 mt-0.5"
                    />
                    <span className="text-sm text-gray-700">
                      Saya setuju dan memahami bahwa booking yang sudah dibayar tidak dapat dibatalkan *
                    </span>
                  </label>
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
                          setVoucher(e.target.value)
                          setVoucherError("")
                        }}
                        placeholder="Masukkan kode voucher (opsional)"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                      />
                      {voucherError && (
                        <p className="text-red-500 text-xs mt-1">{voucherError}</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      onClick={handleClaimVoucher}
                      className="px-6 bg-green-500 text-white hover:bg-green-600 rounded-xl whitespace-nowrap"
                    >
                      Klaim
                    </Button>
                  </div>
                </div>

                {/* Price Summary */}
<div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
  <h3 className="font-semibold text-gray-900 mb-3">Rincian Pembayaran</h3>
  <div className="space-y-2 text-sm">
    <div className="flex justify-between">
      <span className="text-gray-600">Harga Dasar:</span>
      <span className="text-gray-900">
        {idrFormatter(price)} × {people} orang × {selectedTimes.length} sesi
      </span>
    </div>
    <div className="text-right">
      <span className="text-gray-900 font-medium">
        {idrFormatter(price * people * selectedTimes.length)}
      </span>
    </div>

    {addons.filter(a => a.qty > 0 || Object.values(a.selectedSessions || {}).some(qty => qty > 0)).map(a => (
      a.type === 'fixed' ? (
        <div key={a.id}>
          <div className="flex justify-between">
            <span className="text-gray-600">{a.name}:</span>
            <span className="text-gray-900">
              {idrFormatter(a.price)} × {people} orang × {selectedTimes.length} sesi
            </span>
          </div>
          <div className="text-right">
            <span className="text-gray-900 font-medium">
              {idrFormatter(a.price * people * selectedTimes.length)}
            </span>
          </div>
        </div>
      ) : (
        Object.entries(a.selectedSessions || {})
          .filter(([_, qty]) => qty > 0)
          .map(([session, qty]) => (
            <div key={session}>
              <div className="flex justify-between">
                <span className="text-gray-600">{a.name} ({session}):</span>
                <span className="text-gray-900">
                  {idrFormatter(a.price)} × {qty}
                </span>
              </div>
              <div className="text-right">
                <span className="text-gray-900 font-medium">
                  {idrFormatter(a.price * qty)}
                </span>
              </div>
            </div>
          ))
      )
    ))}

    {discount > 0 && (
      <div className="flex justify-between text-green-600">
        <span>Diskon Voucher:</span>
        <span>- {idrFormatter(discount)}</span>
      </div>
    )}

    <div className="border-t border-gray-200 pt-2 mt-2">
      <div className="flex justify-between items-center">
        <span className="font-semibold text-gray-900">Total:</span>
        <span className="text-xl font-bold text-indigo-600">
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
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Booking Sekarang
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}