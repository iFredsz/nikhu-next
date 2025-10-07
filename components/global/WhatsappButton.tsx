'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ArrowUp } from 'lucide-react'
import { FaFacebook, FaInstagram, FaTiktok } from 'react-icons/fa'
import Image from 'next/image'
import contactUsIcon from '@/public/contactus.svg' // Pastikan file ini ada di /public

const ScrollToTopButton = () => {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShow(window.scrollY > 250)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!show) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-6 right-24 z-50"
    >
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="bg-white p-3 rounded-full shadow-lg border-2 border-gray-300 hover:bg-gray-100 transition"
        aria-label="Scroll to top"
      >
        <ArrowUp size={12} className="text-gray-700 scale-150" />
      </button>
    </motion.div>
  )
}

export default function WhatsAppButton() {
  const pathname = usePathname()
  const [isAdminPage, setIsAdminPage] = useState(false)

  useEffect(() => {
    setIsAdminPage(pathname ? pathname.startsWith('/profile/admin') : false)
  }, [pathname])

  if (isAdminPage) return null

  return (
    <>
      {/* Tombol WhatsApp */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed bottom-6 right-4 z-50"
      >
        <motion.a
          href="https://wa.me/6285702262321"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.1 }}
          className="block w-16 h-16"
        >
          <Image
            src={contactUsIcon}
            alt="Contact Us"
            className="w-full h-full object-cover"
          />
        </motion.a>
      </motion.div>

      {/* Tombol Naik */}
      <ScrollToTopButton />

      {/* Tombol Sosial Media */}
      <div className="fixed top-[80px] right-4 z-40 flex space-x-3">
        <a
          href="https://www.tiktok.com/@nikhu.studio"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-black p-3 rounded-full shadow-lg hover:scale-105 transition"
        >
          <FaTiktok className="text-white w-5 h-5" />
        </a>
        <a
          href="https://www.instagram.com/nikhustudio.id"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-pink-500 p-3 rounded-full shadow-lg hover:scale-105 transition"
        >
          <FaInstagram className="text-white w-5 h-5" />
        </a>
      </div>
    </>
  )
}
