import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { toast } from 'sonner'

export type CartItemsStore = {
  id: string
  name: string
  price: number
  quantity: number
  date: string
  times: string[]
  addons?: {
    id: string
    name: string
    price: number
    type: 'fixed' | 'per_item'
    qty: number
    selectedSessions?: { [session: string]: number }
  }[]
  total: number
  thumbnail?: string
  slug?: string
  people?: number
  voucherDiscount?: number
  // TAMBAH INI ↓
  customerName: string
  customerWa: string
}

type CartState = {
  cartItemsStore: CartItemsStore[]
  addItemToCart: (item: CartItemsStore) => void
  removeItemFromCart: (id: string) => void
  clearCart: () => void
}

const useCartStore = create(
  persist<CartState>(
    (set, get) => ({
      cartItemsStore: [],

      addItemToCart: (newItem) => {
        const currentItems = get().cartItemsStore
        
        // Buat unique key berdasarkan id, date, dan times
        const newItemKey = `${newItem.id}-${newItem.date}-${newItem.times.join(',')}`
        
        // Cari item yang sama
        const existingIndex = currentItems.findIndex(
          (item) => `${item.id}-${item.date}-${item.times.join(',')}` === newItemKey
        )

        if (existingIndex >= 0) {
          // Replace item yang sudah ada
          const updatedItems = [...currentItems]
          updatedItems[existingIndex] = {
            ...newItem,
            quantity: 1 // PASTIKAN quantity SELALU 1
          }
          set({ cartItemsStore: updatedItems })
          toast.success('Booking updated in cart!')
        } else {
          // Tambah booking baru dengan quantity 1
          set({ 
            cartItemsStore: [...currentItems, {
              ...newItem,
              quantity: 1 // PASTIKAN quantity SELALU 1
            }] 
          })
          toast.success('Booking added to cart!')
        }
      },

      removeItemFromCart: (id: string) => {
        const currentItems = get().cartItemsStore
        const updatedItems = currentItems.filter((item) => item.id !== id)
        set({ cartItemsStore: updatedItems })
        toast.success('Booking removed from cart!')
      },

      clearCart: () => {
        set({ cartItemsStore: [] })
      },
    }),
    {
      name: 'cart-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

export default useCartStore