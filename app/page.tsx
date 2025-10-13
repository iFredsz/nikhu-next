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
import { Camera, UserCheck, Clock, User, ChevronLeft, ChevronRight, Video } from "lucide-react"
import { toast } from 'sonner'
import Marquee from 'react-fast-marquee'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

// Firebase
import { db } from '../lib/firebase'
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore'

const subtitles = [
  "Kreatif, Memukau, dan Tak Terlupakan",
  "Abadikan Momen Terbaikmu",
  "Fotografi Profesional dengan Sentuhan Artistik",
]

interface Testimonial {
  message: string;
  name: string;
  photo: string;
  rating: number;
  role: string;
}

interface Portfolio {
  id: string
  title: string
  url: string
}

export default function Home() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [subtitleIndex, setSubtitleIndex] = useState(0)
  const [flashTrigger, setFlashTrigger] = useState(0)
  const [isDoubleFlash, setIsDoubleFlash] = useState(false)
  const [selectedImg, setSelectedImg] = useState<string | null>(null)
  const [portfolioImages, setPortfolioImages] = useState<Portfolio[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [marqueeSpeed, setMarqueeSpeed] = useState(40)
  const [isMobile, setIsMobile] = useState(false)

  // Newsletter state
  const [email, setEmail] = useState<string>("")

  const prevRef = useRef<HTMLButtonElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const swiperRef = useRef<any>(null)
  const testimonialSwiperRef = useRef<any>(null)

  // Add CSS animation with critical styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .animate-fadeInUp {
        animation: fadeInUp 0.4s ease-out forwards;
        will-change: opacity, transform;
      }
      
      /* Custom Pagination Styles */
      .custom-pagination-portfolio,
      .custom-pagination-testimonial {
        position: static !important;
        margin-top: 24px !important;
        width: 100% !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        gap: 8px !important;
        contain: layout style paint;
        height: 24px !important;
      }
      
      .swiper-pagination-bullet {
        width: 10px !important;
        height: 10px !important;
        background: #d1d5db !important;
        opacity: 1 !important;
        transition: all 0.3s ease !important;
        will-change: width, background;
      }
      
      .swiper-pagination-bullet-active {
        background: #3b82f6 !important;
        width: 24px !important;
        border-radius: 5px !important;
      }
      
      /* Performance optimizations */
      .swiper-slide {
        will-change: transform;
        backface-visibility: hidden;
        transform: translateZ(0);
      }
      
      .rfm-marquee-container {
        will-change: transform;
        contain: layout style paint;
        backface-visibility: hidden;
      }
      
      /* Prevent layout shift */
      img[loading="lazy"] {
        content-visibility: auto;
      }
      
      /* Reduce repaints */
      * {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      /* GPU Acceleration */
      .swiper-wrapper {
        transform: translateZ(0);
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Detect mobile with passive listener
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile, { passive: true })
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Ambil data portfolio dari Firestore dengan batasan
  useEffect(() => {
    setIsLoading(true)
    const unsub = onSnapshot(
      collection(db, "portfolio"), 
      (snapshot) => {
        const data: Portfolio[] = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .slice(0, 12) as Portfolio[] // Batasi hanya 12 item untuk performa
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

  // Load testimonials
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "testimonials"), (snapshot) => {
      const data = snapshot.docs.map((doc) => doc.data() as Testimonial);
      setTestimonials(data);
    });
    return () => unsub();
  }, []);

  // Ganti subtitle otomatis
  useEffect(() => {
    const interval = setInterval(() => {
      setSubtitleIndex((prev) => (prev + 1) % subtitles.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Camera Flash Animation - Random single/double flash without freeze
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const triggerFlash = () => {
      const willDoubleFlash = Math.random() > 0.5;
      setIsDoubleFlash(willDoubleFlash);
      setFlashTrigger(prev => prev + 1);
      const nextDelay = 3000 + Math.random() * 3000;
      timeoutId = setTimeout(triggerFlash, nextDelay);
    };
    timeoutId = setTimeout(triggerFlash, 2000);
    return () => clearTimeout(timeoutId);
  }, [])

  // Handle Swiper navigation initialization - dengan debounce untuk prevent forced reflow
  const updateSwiperNavigation = useCallback((swiper: any) => {
    requestAnimationFrame(() => {
      if (swiper && swiper.params && swiper.params.navigation && swiper.navigation) {
        swiper.params.navigation.prevEl = prevRef.current
        swiper.params.navigation.nextEl = nextRef.current
        swiper.navigation.destroy()
        swiper.navigation.init()
        swiper.navigation.update()
      }
    })
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
  const handleSubscribe = async () => {
    if (!email) {
      toast.error("Masukkan email terlebih dahulu.");
      return;
    }

    try {
      await setDoc(doc(db, "newsletter", email), {
        email,
        createdAt: new Date(),
      });
      toast.success("Terima kasih sudah subscribe!");
      setEmail("");
    } catch (error) {
      console.error("Error menyimpan email:", error);
      toast.error("Gagal subscribe, coba lagi.");
    }
  }

  return (
    <>
      {/* Hero Section */}
      <section className="section-full-width grid grid-cols-1 items-center md:grid-cols-2 md:mt-12 mt-16 mb-16 md:mb-0 overflow-hidden">
        {/* Text */}
        <div className="mx-auto mb-12 mt-8 flex max-w-[600px] flex-col items-center text-center md:m-0 md:max-w-none md:items-start md:text-left md:pr-[10%]">
          <h1 className="mb-4 md:ml-20 md:text-3xl text-2xl font-bold text-gray-800">
            Momentmu, Lensa Kami 🙂
          </h1>
          <AnimatePresence mode="wait">
            <motion.p
              key={subtitleIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="mb-8 md:ml-20 text-md min-h-[60px] flex items-center justify-center md:justify-start text-gray-600 mt-4"
            >
              {subtitles[subtitleIndex]}
            </motion.p>
          </AnimatePresence>
          <Button asChild className="md:ml-20 px-12 py-3">
            <Link href="/products">Booking Now</Link>
          </Button>
        </div>
        {/* Hero Image - Optimized for mobile LCP */}
        <div className="relative w-full flex justify-center md:justify-end">
          <div
            className="relative w-full max-w-[600px]"
            style={{ aspectRatio: '600/611' }}
          >
            <Image
              src="/fotografer.webp"
              alt="Fotografer profesional sedang memotret"
              width={460}
              height={420}
              priority
              fetchPriority="high"
              quality={85}
              className="object-contain rounded-lg"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 80vw, 460px"
              loading="eager"
              decoding="async"
            />
            {/* Camera Flash Animation */}
            <motion.div
              key={`flash-${flashTrigger}`}
              className="absolute inset-0 bg-white rounded-lg pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: isDoubleFlash 
                  ? [0, 0.95, 0.3, 0.95, 0] 
                  : [0, 0.95, 0],
              }}
              transition={{
                duration: isDoubleFlash ? 0.6 : 0.3,
                times: isDoubleFlash 
                  ? [0, 0.15, 0.35, 0.5, 1] 
                  : [0, 0.3, 1],
                ease: "easeOut"
              }}
              style={{
                mixBlendMode: 'screen',
              }}
            />
            {/* Flash Light Beam Effect */}
            <motion.div
              key={`beam-${flashTrigger}`}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full blur-3xl pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,200,0.3) 40%, rgba(255,255,255,0) 70%)',
              }}
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ 
                opacity: isDoubleFlash
                  ? [0, 1, 0.4, 1, 0]
                  : [0, 1, 0],
                scale: isDoubleFlash
                  ? [0.3, 1.5, 1, 2, 2.5]
                  : [0.3, 2, 2.5],
              }}
              transition={{
                duration: isDoubleFlash ? 0.7 : 0.4,
                times: isDoubleFlash
                  ? [0, 0.15, 0.35, 0.5, 1]
                  : [0, 0.4, 1],
                ease: "easeOut"
              }}
            />
            {/* Lens Flare Effect - Only on larger screens for performance */}
            <motion.div
              key={`flare-${flashTrigger}`}
              className="hidden md:block absolute top-1/3 right-1/3 w-20 h-20 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(255,200,100,0.2) 50%, transparent 70%)',
                filter: 'blur(8px)',
              }}
              initial={{ opacity: 0, x: 0, y: 0 }}
              animate={{ 
                opacity: isDoubleFlash
                  ? [0, 0.8, 0.3, 0.8, 0]
                  : [0, 0.8, 0],
                x: [0, 30, 50],
                y: [0, 20, 30],
                scale: isDoubleFlash
                  ? [0.5, 1, 0.8, 1.2, 1.3]
                  : [0.5, 1.2, 1.3],
              }}
              transition={{
                duration: isDoubleFlash ? 0.6 : 0.35,
                ease: "easeOut"
              }}
            />
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section className="section-full-width md:py-0 mb-4 py-12 relative">
        <div className="container mx-auto px-4">
          {portfolioImages.length > 0 && (
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">Hasil Karya Kami</h2>
          )}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
            </div>
          ) : portfolioImages.length > 0 ? (
            <div className="relative">
              <button
                ref={prevRef}
                aria-label="Sebelumnya"
                className="absolute left-2 top-[calc(50%-48px)] transform -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full z-10 shadow-lg transition-all opacity-70 hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed min-w-[48px] min-h-[48px]"
                disabled={portfolioImages.length <= 1}
              >
                <ChevronLeft className="w-6 h-6 text-yellow-600" />
              </button>
              <button
                ref={nextRef}
                aria-label="Selanjutnya"
                className="absolute right-2 top-[calc(50%-48px)] transform -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full z-10 shadow-lg transition-all opacity-70 hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed min-w-[48px] min-h-[48px]"
                disabled={portfolioImages.length <= 1}
              >
                <ChevronRight className="w-6 h-6 text-yellow-600" />
              </button>
              <Swiper
                modules={[Navigation, Pagination]}
                spaceBetween={20}
                slidesPerView={1}
                centeredSlides={true}
                loop={portfolioImages.length > 1}
                speed={400}
                threshold={5}
                resistance={true}
                resistanceRatio={0.85}
                touchRatio={1}
                touchAngle={45}
                grabCursor={true}
                pagination={{
                  clickable: true,
                  dynamicBullets: true,
                  el: '.custom-pagination-portfolio',
                }}
                navigation={{
                  prevEl: prevRef.current,
                  nextEl: nextRef.current,
                }}
                onSwiper={handleSwiperInit}
                onInit={updateSwiperNavigation}
                breakpoints={{
                  640: { 
                    slidesPerView: 1.15,
                    spaceBetween: 20,
                    centeredSlides: true,
                  },
                  768: {
                    slidesPerView: 2,
                    spaceBetween: 25,
                    centeredSlides: true,
                  },
                  1024: { 
                    slidesPerView: Math.min(portfolioImages.length, 3),
                    spaceBetween: 30,
                    centeredSlides: true,
                  },
                }}
                className="px-2"
                watchSlidesProgress={true}
              >
                {portfolioImages.map((img, index) => (
                  <SwiperSlide key={img.id}>
                    <div 
                      className="cursor-pointer transform transition-transform"
                      onClick={() => setSelectedImg(img.url)}
                    >
                      <div className="relative w-full aspect-[4/5] overflow-hidden rounded-xl md:rounded-2xl shadow-lg">
                        <Image
                          src={img.url}
                          alt={img.title ? `Portfolio: ${img.title}` : "Portfolio"}
                          fill
                          loading={index < 3 ? "eager" : "lazy"}
                          quality={70}
                          className="object-cover hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 90vw, (max-width: 768px) 48vw, (max-width: 1024px) 32vw, 380px"
                        />
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
              <div className="custom-pagination-portfolio mt-6"></div>
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
                aria-label="Tutup preview"
                className="absolute top-6 right-6 w-12 h-12 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center shadow-lg transition z-10"
              >
                <span className="text-2xl font-bold select-none">×</span>
              </button>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-4xl aspect-video"
              >
                <Image
                  src={selectedImg}
                  alt="Preview portfolio"
                  fill
                  quality={80}
                  className="rounded-lg shadow-2xl object-contain"
                  sizes="(max-width: 768px) 95vw, 1200px"
                  loading="lazy"
                  decoding="async"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Paket & Booking CTA */}
      <section className="section-full-width py-20 bg-gradient-to-r from-gray-700 via-gray-500 to-gray-400 text-white relative overflow-hidden">
        <div className="absolute top-[-80px] left-[-80px] w-72 h-72 bg-white/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-60px] right-[-60px] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Paket Fotografi Terjangkau
          </h2>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            Nikmati layanan fotografi profesional mulai dari{" "}
            <span className="font-bold text-yellow-300">Rp 30.000</span>! Cocok untuk pre-wedding, family, portrait, dan semua momen spesialmu.
          </p>
          <Link href="/products" className="inline-block px-10 py-4 bg-white text-yellow-500 font-bold rounded-full shadow-lg hover:bg-yellow-100 transition-colors" aria-label="Booking Sekarang">
            Booking Now
          </Link>
        </div>
      </section>

      {/* Testimonials - Marquee for Desktop, Swiper for Mobile */}
      {testimonials.length > 0 && (
        <section
          className="section-full-width py-16 text-center relative bg-[#f3f4f6] overflow-hidden"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-gray-800">
            Apa Kata Klien Kami
          </h2>
          
          {/* Desktop - Marquee */}
          <div className="hidden md:block w-full overflow-hidden py-4">
            <Marquee
              speed={marqueeSpeed}
              gradient={true}
              gradientColor="#f3f4f6"
              gradientWidth={50}
              pauseOnHover={true}
              play={true}
              direction="left"
            >
              {testimonials.map((t, i) => (
                <div
                  key={`testimonial-desktop-${i}`}
                  className="mx-3 w-[340px] bg-white rounded-2xl shadow-lg p-6 flex-shrink-0 transform"
                >
                  {t.photo ? (
                    <div className="relative w-16 h-16 mx-auto mb-4">
                      <Image
                        src={t.photo}
                        alt={`Foto ${t.name}`}
                        width={64}
                        height={64}
                        loading="lazy"
                        quality={60}
                        className="rounded-full object-cover border-2 border-gray-300"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
                      <User className="text-gray-600 w-8 h-8" />
                    </div>
                  )}
                  <p className="text-gray-700 italic mb-4 min-h-[60px] text-base line-clamp-3">
                    &ldquo;{t.message}&rdquo;
                  </p>
                  <div className="flex justify-center mb-2 text-yellow-500">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <svg
                        key={idx}
                        xmlns="http://www.w3.org/2000/svg"
                        fill={idx < t.rating ? "currentColor" : "none"}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        className="w-5 h-5"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.003 6.145h6.462c.969 0 1.371 1.24.588 1.81l-5.234 3.805 2.003 6.145c.3.921-.755 1.688-1.539 1.118l-5.233-3.804-5.233 3.804c-.783.57-1.838-.197-1.539-1.118l2.003-6.145-5.234-3.805c-.783-.57-.38-1.81.588-1.81h6.462l2.003-6.145z"
                        />
                      </svg>
                    ))}
                  </div>
                  <h4 className="font-semibold text-gray-800">{t.name}</h4>
                  <span className="text-sm text-gray-500">{t.role}</span>
                </div>
              ))}
            </Marquee>
          </div>

          {/* Mobile - Swiper */}
          <div className="block md:hidden">
            <Swiper
              modules={[Pagination]}
              spaceBetween={16}
              slidesPerView={1}
              centeredSlides={true}
              loop={testimonials.length > 1}
              speed={400}
              threshold={5}
              pagination={{
                clickable: true,
                dynamicBullets: true,
                el: '.custom-pagination-testimonial',
              }}
              breakpoints={{
                480: {
                  slidesPerView: 1.1,
                  spaceBetween: 20,
                  centeredSlides: true,
                },
                640: {
                  slidesPerView: 1.2,
                  spaceBetween: 20,
                  centeredSlides: true,
                },
              }}
            >
              {testimonials.map((t, i) => (
                <SwiperSlide key={`testimonial-mobile-${i}`}>
                  <div className="bg-white rounded-2xl shadow-lg p-6 h-full mx-2">
                    {t.photo ? (
                      <div className="relative w-16 h-16 mx-auto mb-4">
                        <Image
                          src={t.photo}
                          alt={`Foto ${t.name}`}
                          width={64}
                          height={64}
                          loading="lazy"
                          quality={60}
                          className="rounded-full object-cover border-2 border-gray-300"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
                        <User className="text-gray-600 w-8 h-8" />
                      </div>
                    )}
                    <p className="text-gray-700 italic mb-4 min-h-[60px] text-sm line-clamp-3">
                      &ldquo;{t.message}&rdquo;
                    </p>
                    <div className="flex justify-center mb-2 text-yellow-500">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <svg
                          key={idx}
                          xmlns="http://www.w3.org/2000/svg"
                          fill={idx < t.rating ? "currentColor" : "none"}
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          className="w-5 h-5"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.003 6.145h6.462c.969 0 1.371 1.24.588 1.81l-5.234 3.805 2.003 6.145c.3.921-.755 1.688-1.539 1.118l-5.233-3.804-5.233 3.804c-.783.57-1.838-.197-1.539-1.118l2.003-6.145-5.234-3.805c-.783-.57-.38-1.81.588-1.81h6.462l2.003-6.145z"
                          />
                        </svg>
                      ))}
                    </div>
                    <h4 className="font-semibold text-gray-800">{t.name}</h4>
                    <span className="text-sm text-gray-500">{t.role}</span>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
            <div className="custom-pagination-testimonial mt-6"></div>
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="section-full-width bg-[#f3f4f6] py-16">
        <div className="container mx-auto text-center px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            Mengapa Memilih Nikhu Studio
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Camera className="h-10 w-10 text-white" />,
                title: "Peralatan Profesional",
                desc: "Kamera & lighting terbaik untuk momenmu.",
                bgColor: "bg-gray-400",
              },
              {
                icon: <UserCheck className="h-10 w-10 text-white" />,
                title: "Fotografer Berpengalaman",
                desc: "Hasil foto sempurna setiap sesi.",
                bgColor: "bg-green-400",
              },
              {
                icon: <Video className="h-10 w-10 text-white" />,
                title: "Setup Kreatif",
                desc: "Properti dan latar unik & memorable.",
                bgColor: "bg-purple-400",
              },
              {
                icon: <Clock className="h-10 w-10 text-white" />,
                title: "Jadwal Fleksibel",
                desc: "Booking sesuai jadwalmu.",
                bgColor: "bg-pink-400",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-2xl shadow-lg ${item.bgColor} opacity-0 animate-fadeInUp`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex justify-center mb-3">
                  {item.icon}
                </div>
                <h4 className="text-xl font-semibold mb-2 text-white">{item.title}</h4>
                <p className="text-white">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-full-width py-16 bg-[#f3f4f6]">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">Pertanyaan Umum</h2>
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-xl shadow">
              <h4 className="font-semibold">Apakah bisa foto di luar studio?</h4>
              <p className="mt-2 text-gray-700">Tentu, kami menyediakan opsi outdoor photoshoot sesuai paket.</p>
            </div>
            <div className="p-4 bg-white rounded-xl shadow">
              <h4 className="font-semibold">Berapa lama proses editing foto?</h4>
              <p className="mt-2 text-gray-700">Proses editing biasanya 3-5 hari kerja untuk paket standar.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="section-full-width bg-gradient-to-b from-[#f3f4f6] to-white py-8 md:py-16 text-center px-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Dapatkan Tips Fotografi & Promo</h2>
        <p className="mb-4 md:mb-6 text-gray-700 text-sm md:text-base">Subscribe newsletter kami</p>
        <form
          className="flex justify-center gap-2 flex-wrap max-w-xs mx-auto"
          onSubmit={e => {
            e.preventDefault();
            handleSubscribe();
          }}
          aria-label="Form Newsletter"
        >
          <label htmlFor="newsletter-email" className="sr-only">Email Anda</label>
          <input
            id="newsletter-email"
            type="email"
            placeholder="Email Anda"
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Email untuk newsletter"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-yellow-400 text-white font-semibold rounded-lg hover:bg-yellow-500 transition text-sm"
            aria-label="Subscribe ke newsletter"
          >
            Subscribe
          </button>
        </form>
      </section>
    </>
  )
}