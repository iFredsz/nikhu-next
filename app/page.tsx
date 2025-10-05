'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { idrFormatter } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { allProducts } from '@/data/data'
import CarouselFade from '@/components/carousel/CarouselFade'
import { useEffect, useState, useRef, useCallback } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

// Firebase
import { db } from './firebase'
import { collection, onSnapshot } from 'firebase/firestore'

const heroImageUrls = [
  '/products/classic-1.webp',
  '/products/corsa-2.webp',
  '/products/white-3.webp',
  '/products/corte-1.webp',
]

const subtitles = [
  "Kreatif, Memukau, dan Tak Terlupakan",
  "Abadikan Momen Terbaikmu",
  "Fotografi Profesional dengan Sentuhan Artistik",
]

interface Portfolio {
  id: string
  title: string
  url: string
}

export default function Home() {
  const [subtitleIndex, setSubtitleIndex] = useState(0)
  const [selectedImg, setSelectedImg] = useState<string | null>(null)
  const [portfolioImages, setPortfolioImages] = useState<Portfolio[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Newsletter state
  const [email, setEmail] = useState<string>("")

  const prevRef = useRef<HTMLButtonElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const swiperRef = useRef<any>(null)

  // Ambil data portfolio dari Firestore
  useEffect(() => {
    setIsLoading(true)
    const unsub = onSnapshot(
      collection(db, "portfolio"), 
      (snapshot) => {
        const data: Portfolio[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Portfolio[]
        setPortfolioImages(data)
        setIsLoading(false)
      },
      (error) => {
        console.error("Error fetching portfolio:", error)
        setIsLoading(false)
      }
    )
    return () => unsub()
  }, [])

  // Ganti subtitle otomatis
  useEffect(() => {
    const interval = setInterval(() => {
      setSubtitleIndex((prev) => (prev + 1) % subtitles.length)
    }, 3000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handle Swiper navigation initialization
  const updateSwiperNavigation = useCallback((swiper: any) => {
    if (swiper && swiper.params.navigation) {
      swiper.params.navigation.prevEl = prevRef.current
      swiper.params.navigation.nextEl = nextRef.current
      swiper.navigation.destroy()
      swiper.navigation.init()
      swiper.navigation.update()
    }
  }, [])

  const handleSwiperInit = useCallback((swiper: any) => {
    swiperRef.current = swiper
    updateSwiperNavigation(swiper)
  }, [updateSwiperNavigation])

  // Close lightbox on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedImg(null)
    }

    if (selectedImg) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [selectedImg])

  // Newsletter handler
  const handleSubscribe = () => {
    if (!email) {
      alert("Masukkan email terlebih dahulu.")
      return
    }
    // Simpan ke database / kirim ke API sesuai kebutuhan
    console.log("Subscribed with email:", email)
    alert("Terima kasih sudah subscribe!")
    setEmail("")
  }

  return (
    <>
      {/* Hero Section */}
      <section className='mb-12 grid grid-cols-1 items-center md:mb-16 md:min-h-[450px] md:grid-cols-2 lg:min-h-[650px]'>
        <div className='mx-auto mb-12 mt-8 flex max-w-[600px] flex-col items-center md:m-0 md:max-w-none md:items-start md:pr-[10%]'>
          <h1 className='mb-4 text-center md:text-left'>
            Momentmu, Lensa Kami :)
          </h1>
          <AnimatePresence mode='wait'>
            <motion.p
              key={subtitleIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className='mb-8 text-center md:text-left min-h-[60px] flex items-center'
            >
              {subtitles[subtitleIndex]}
            </motion.p>
          </AnimatePresence>
          <Button asChild className='px-12'>
            <Link href='/products'>Booking Now</Link>
          </Button>
        </div>
        <div className='relative'>
          <CarouselFade images={heroImageUrls} />
        </div>
      </section>

     

      {/* Portfolio Section */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4">
          {portfolioImages.length > 0 && (
            <h2 className="text-3xl font-bold mb-12 text-center">Hasil Karya Kami</h2>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
            </div>
          ) : portfolioImages.length > 0 ? (
            <div className="relative">
              <button
                ref={prevRef}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full z-10 shadow-lg transition-all opacity-70 hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
                disabled={portfolioImages.length <= 1}
              >
                <ChevronLeft className="w-6 h-6 text-yellow-600" />
              </button>

              <button
                ref={nextRef}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full z-10 shadow-lg transition-all opacity-70 hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
                disabled={portfolioImages.length <= 1}
              >
                <ChevronRight className="w-6 h-6 text-yellow-600" />
              </button>

              <Swiper
                modules={[Navigation, Pagination]}
                spaceBetween={20}
                slidesPerView={1}
                loop={portfolioImages.length > 1}
                pagination={{
                  clickable: true,
                  dynamicBullets: true,
                }}
                navigation={{
                  prevEl: prevRef.current,
                  nextEl: nextRef.current,
                }}
                onSwiper={handleSwiperInit}
                onInit={updateSwiperNavigation}
                breakpoints={{
                  640: { 
                    slidesPerView: Math.min(portfolioImages.length, 2),
                    spaceBetween: 20
                  },
                  768: {
                    slidesPerView: Math.min(portfolioImages.length, 2),
                    spaceBetween: 25
                  },
                  1024: { 
                    slidesPerView: Math.min(portfolioImages.length, 3),
                    spaceBetween: 30
                  },
                }}
                className="px-2"
              >
                {portfolioImages.map((img) => (
                  <SwiperSlide key={img.id}>
                    <div 
                      className="cursor-pointer"
                      onClick={() => setSelectedImg(img.url)}
                    >
                      <div className="relative w-full h-64 sm:h-80 md:h-96 overflow-hidden rounded-2xl shadow-lg">
                        <Image
                          src={img.url}
                          alt={img.title || "Portfolio"}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          ) : (
            !isLoading && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Belum ada portfolio yang tersedia.</p>
              </div>
            )
          )}
        </div>

        {/* Lightbox */}
        <AnimatePresence>
          {selectedImg && (
            <motion.div
              className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImg(null)}
            >
              <button
                onClick={() => setSelectedImg(null)}
                className="absolute top-6 right-6 w-12 h-12 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center shadow-lg transition z-10"
              >
                <span className="text-2xl font-bold select-none">×</span>
              </button>
              
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-4xl max-h-[85vh]"
              >
                <div className="relative w-full h-0 pb-[56.25%]">
                  <Image
                    src={selectedImg}
                    alt="Preview"
                    fill
                    className="rounded-lg shadow-2xl object-contain"
                    priority
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Newsletter */}
      <section className="py-8 md:py-16 text-center px-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Dapatkan Tips Fotografi & Promo</h2>
        <p className="mb-4 md:mb-6 text-gray-700 text-sm md:text-base">Subscribe newsletter kami</p>
        <div className="flex justify-center gap-2 flex-wrap max-w-xs mx-auto">
          <input
  type="email"
  placeholder="Email Anda"
  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

          <button
            className="px-4 py-2 bg-yellow-400 text-white font-semibold rounded-lg hover:bg-yellow-500 transition text-sm"
            onClick={handleSubscribe}
          >
            Subscribe
          </button>
        </div>
      </section>
    </>
  )
}
