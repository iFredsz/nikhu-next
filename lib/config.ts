import { User, Package, Shield } from 'lucide-react'

// HEADER
export const navMenu = [
  {
    title: 'Home',
    href: '/',
  },
  {
    title: 'Booking',
    href: '/products',
  },
  {
    title: 'Contact',
    href: '/contact',
  },
]

// PROFILE MENU (semua menu dasar)
const baseProfileMenu = [
  {
    title: 'Profile',
    href: '/profile',
    icon: User,
  },
  {
    title: 'Orders',
    href: '/profile/orders',
    icon: Package,
  },
]

// MENU ADMIN tambahan
const adminMenu = {
  title: 'Admin',
  href: '/profile/admin',
  icon: Shield,
}

// 🔹 Fungsi dinamis: generate menu berdasarkan role
export const getProfileMenu = (role: string | null) => {
  if (role === 'admin') {
    return [...baseProfileMenu, adminMenu]
  }
  return baseProfileMenu
}
