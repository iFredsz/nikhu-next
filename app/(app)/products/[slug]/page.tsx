'use client'

import { formatDate } from '@/utils/date'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import ProductCarousel1 from '@/components/carousel/ProductCarousel1'
import { idrFormatter } from '@/lib/utils'
import useCartStore from '@/store/cart-store'
import { toast } from 'sonner'
import { db } from '@/app/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

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
  const { addItemToCart } = useCartStore()

  const [date, setDate] = useState<Date | null>(null)
  const [selectedTimes, setSelectedTimes] = useState<string[]>([])
  const [people, setPeople] = useState(1)
  const [name, setName] = useState("")
  const [wa, setWa] = useState("")
  const [agree, setAgree] = useState(false)
  const [voucher, setVoucher] = useState("")
  const [discount, setDiscount] = useState(0)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const q = query(collection(db, 'products'), where('slug', '==', slug))
        const querySnapshot = await getDocs(q)
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
        } else setProductData(null)
      } catch (error) {
        console.error('Error fetching product:', error)
        setProductData(null)
      } finally {
        setLoading(false)
      }
    }

    const fetchAddons = async () => {
      try {
        const snap = await getDocs(collection(db, 'addons'))
        setAddons(snap.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || 'Addon',
          price: Number(doc.data().price) || 0,
          type: (doc.data().type as 'fixed' | 'per_item') || 'fixed',
          qty: 0,
          selectedSessions: {}
        })))
      } catch (err) {
        console.error('Error fetching addons:', err)
      }
    }

    const fetchVouchers = async () => {
      try {
        const snap = await getDocs(collection(db, 'vouchers'))
        setVoucherList(snap.docs.map(doc => doc.data() as Voucher))
      } catch (err) {
        console.error('Error fetching vouchers:', err)
      }
    }

    fetchProduct()
    fetchAddons()
    fetchVouchers()
  }, [slug])

  if (loading) return <p className="text-center mt-10">Loading product...</p>
  if (!productData) return <p className="text-center mt-10">Product not found</p>

  const { id, name: productName, price, description, gallery, thumbnail } = productData
  const imagesToShow = thumbnail ? [thumbnail, ...gallery.filter(img => img !== thumbnail)] : gallery

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

  const handleClaimVoucher = () => {
    const found = voucherList.find(v => v.code === voucher && v.active)
    if (found) {
      setDiscount(found.amount)
      toast.success(`Voucher ${voucher} berhasil diklaim! Potongan ${idrFormatter(found.amount)}`)
    } else {
      setDiscount(0)
      toast.error("Voucher tidak valid atau sudah tidak aktif")
    }
  }

  const handleSubmit = () => {
    if (!name || !wa || !date || selectedTimes.length === 0 || !agree) {
      toast.error("Mohon lengkapi semua data!")
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

    // toast.success sudah dipanggil di store
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="mb-10 mt-5 flex gap-4 md:mt-0">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/products">Products</Link>
        <span>/</span>
        <p className="text-gray-500">{productName}</p>
      </div>

      <div className="md:grid md:grid-cols-5" id="product-details">
        {/* Carousel + Description */}
        <div className="col-span-3 mb-8 md:mb-0 md:pr-10 lg:pr-20">
          <ProductCarousel1 images={imagesToShow} />
          {description && (
            <div className="mt-4 p-4 bg-white rounded-lg shadow-sm text-gray-700 whitespace-pre-line">
              {description}
            </div>
          )}
        </div>

        {/* Form & Addons */}
        <div className="col-span-2">
          <div className="p-6 bg-white rounded-lg shadow-md space-y-4">
            <h1 className="text-xl md:text-3xl font-bold text-gray-900">{productName}</h1>
            <p className="text-lg text-gray-800">{idrFormatter(price)} / Sesi</p>

            {/* Tanggal */}
            <div>
              <label className="block font-medium text-gray-800 mb-2">Pilih Tanggal</label>
              <DatePicker
                selected={date}
                onChange={d => setDate(d)}
                dateFormat="dd/MM/yyyy"
                minDate={new Date()}
                placeholderText='Klik untuk memilih tanggal'
                className="w-full bg-white text-gray-900 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            {/* Jam */}
            <div>
              <label className="block font-medium text-gray-800 mb-2">Pilih Jam (Sesi)</label>
              <div className="grid grid-cols-3 gap-2">
                {times.map(t => (
                  <button
                    key={t}
                    type="button"
                    disabled={t === "12:30" || t === "18:30"}
                    onClick={() => {
                      setSelectedTimes(prev =>
                        prev.includes(t) ? prev.filter(time => time !== t) : [...prev, t]
                      )
                    }}
                    className={`px-2 py-1 rounded border ${
                      selectedTimes.includes(t) ? "bg-indigo-600 text-white" : "bg-white text-gray-900"
                    } ${t === "12:30" || t === "18:30" ? "opacity-50 cursor-not-allowed" : "hover:bg-indigo-100"}`}
                  >
                    {t}{t === "12:30" || t === "18:30" ? " (breaks)" : ""}
                  </button>
                ))}
              </div>
            </div>

            {/* Jumlah Orang */}
            <div>
              <label className="block font-medium text-gray-800 mb-2">Jumlah Orang</label>
              <div className="flex items-center gap-2">
                <Button type="button" onClick={() => setPeople(Math.max(1, people - 1))} className="bg-black text-white border px-2 py-1">-</Button>
                <span className="px-3 text-gray-900">{people}</span>
                <Button type="button" onClick={() => setPeople(people + 1)} className="bg-black text-white border px-2 py-1">+</Button>
              </div>
            </div>

            {/* Addons */}
            <div>
              <label className="block font-medium text-gray-800 mb-2">Opsi Tambahan</label>
              <div className="space-y-2">
                {addons.map(addon => (
                  <div key={addon.id} className="border p-2 rounded space-y-1">
                    {addon.type === 'fixed' ? (
                      <label className="flex items-center gap-2 text-gray-800">
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
                          className="h-4 w-4 accent-indigo-500"
                        />
                        <span>{addon.name} (+{idrFormatter(addon.price)} / sesi)</span>
                      </label>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-800">{addon.name} (+{idrFormatter(addon.price)} per item)</span>
                          <Button
                            type="button"
                            onClick={() => handleAddonQtyChange(addon.id, -1)}
                            className={`bg-black text-white border px-2 py-1 ${addon.qty === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={addon.qty === 0}
                          >-</Button>
                          <span>{addon.qty}</span>
                          <Button
                            type="button"
                            onClick={() => handleAddonQtyChange(addon.id, 1)}
                            className="bg-black text-white border px-2 py-1"
                          >+</Button>
                        </div>

                        {/* Hanya tampilkan session selector jika ada qty dan jam dipilih */}
                        {addon.qty > 0 && selectedTimes.length > 0 && (
                          <div className="space-y-1 mt-1">
                            <p className="text-sm text-gray-600">Distribusi item per sesi:</p>
                            {selectedTimes.map(session => {
                              const count = addon.selectedSessions?.[session] || 0
                              return (
                                <div key={session} className="flex items-center gap-2">
                                  <span className="w-16">{session}</span>
                                  <Button
                                    type="button"
                                    onClick={() => handleSessionQtyChange(addon.id, session, -1)}
                                    className={`bg-black text-white border px-2 py-1 ${count === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={count === 0}
                                  >-</Button>
                                  <span>{count}</span>
                                  <Button
                                    type="button"
                                    onClick={() => handleSessionQtyChange(addon.id, session, 1)}
                                    className="bg-black text-white border px-2 py-1"
                                  >+</Button>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {addons.length === 0 && <p className="text-gray-500">Tidak ada opsi tambahan.</p>}
              </div>
            </div>

            {/* Nama & WA */}
            <div>
              <label className="block font-medium text-gray-800 mb-2">Nama</label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="Contoh: Budi Sapi"
                className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-800 mb-2">No WhatsApp</label>
              <input value={wa} onChange={e => setWa(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            {/* Agree */}
            <div>
              <label className="flex items-center gap-2 text-gray-800">
                <input 
                  type="checkbox" 
                  checked={agree} 
                  onChange={e => setAgree(e.target.checked)} 
                  className="h-4 w-4 accent-indigo-500" 
                />
                <span>Saya setuju masuk konten (Wajib)</span>
              </label>
            </div>

            {/* Voucher */}
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <label className="block font-medium text-gray-800 mb-2">Voucher Diskon (Opsional)</label>
                <input
                  value={voucher}
                  onChange={e => setVoucher(e.target.value)}
                  placeholder="Contoh: VOUCHERXXX"
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <Button
                type="button"
                onClick={handleClaimVoucher}
                className="h-10 mt-6 bg-green-500 text-white hover:bg-green-600"
              >
                Klaim
              </Button>
            </div>

            {/* Rincian harga */}
            <div className="p-4 border border-gray-200 rounded bg-gray-50 space-y-1">
              <p className="text-base font-semibold text-gray-800 mb-2">Rincian Pembayaran</p>
              <p className="text-gray-700">
                Harga Dasar: {idrFormatter(price)} × {people} orang × {selectedTimes.length} sesi = {idrFormatter(price * people * selectedTimes.length)}
              </p>
              {addons.filter(a => a.qty > 0).map(a => (
                a.type === 'fixed' ? (
                  <p key={a.id} className="text-gray-700">
                    {a.name}: {idrFormatter(a.price)} × {people} orang × {selectedTimes.length} sesi = {idrFormatter(a.price * a.qty * selectedTimes.length * people)}
                  </p>
                ) : (
                  Object.entries(a.selectedSessions || {})
                    .filter(([_, qty]) => qty > 0) // Hanya tampilkan yang qty > 0
                    .map(([session, qty]) => (
                      <p key={session} className="text-gray-700">
                        {a.name} ({session}): {idrFormatter(a.price)} × {qty} = {idrFormatter(a.price * qty)}
                      </p>
                    ))
                )
              ))}
              {discount > 0 && (
                <p className="text-gray-700">Diskon: - {idrFormatter(discount)}</p>
              )}
              <p className="font-bold text-lg mt-2">Total: {idrFormatter(total)}</p>
            </div>

            {/* Submit */}
            <Button onClick={handleSubmit} className="h-12 w-full rounded-full text-base bg-indigo-600 text-white hover:bg-indigo-700">
              Booking Sekarang
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}