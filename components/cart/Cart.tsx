'use client'

import { useEffect, useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '../ui/button'
import CartItem from './CartItem'
import useCartStore from '@/store/cart-store'
import { idrFormatter } from '@/lib/utils'
import Checkout from './Checkout'

export type ExtendedCartItems = {
  id: string
  name: string
  price: number
  quantity: number
  date?: string
  times?: string[]
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
  customerName?: string
  customerWa?: string
  // Tambah properti lain jika perlu
  // Contoh: voucherDiscount, customerName,

}

type CartItems = {
  items: ExtendedCartItems[]
  total_quantity: number
  total_price: number
}

export default function CartButtonServer() {
  const { cartItemsStore } = useCartStore()
  const [isOpen, setIsOpen] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [cartItems, setCartItems] = useState<CartItems>({
    items: [],
    total_quantity: 0,
    total_price: 0,
  })

  const handleClose = () => setIsOpen(false)
  const handleIsFetching = (state: boolean) => setIsFetching(state)

  useEffect(() => {
    const items = (cartItemsStore ?? []) as ExtendedCartItems[]

    // Total quantity adalah jumlah booking (bukan jumlah sesi)
    const total_quantity = items.length

    // Gunakan total yang sudah dihitung dari booking page
    const total_price = items.reduce((sum, item) => sum + (item.total ?? 0), 0)

    setCartItems({
      items,
      total_quantity,
      total_price,
    })
  }, [cartItemsStore])

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant='outline' className='rounded-full'>
          <ShoppingCart className='mr-2 h-4 w-4' />
          <span>{cartItems.total_quantity}</span>
        </Button>
      </SheetTrigger>
      <SheetContent className='flex w-full flex-col min-[500px]:max-w-sm sm:max-w-md'>
        <SheetHeader className='mb-4'>
          <SheetTitle>Cart</SheetTitle>
          {cartItems.items.length === 0 && <SheetDescription>Cart is empty</SheetDescription>}
        </SheetHeader>

        {cartItems.items.length !== 0 && (
          <div className='flex flex-1 flex-col gap-8 overflow-y-hidden'>
            <div className='flex flex-1 flex-col gap-4 overflow-hidden overflow-y-auto'>
              {cartItems.items.map((item, index) => (
                <CartItem
                  key={`${item.id}-${item.date}-${index}`}
                  data={item}
                  isFetching={isFetching}
                  handleSheetClose={handleClose}
                />
              ))}
            </div>

            <div>
              <div className='mb-5 flex justify-between'>
                <span>Subtotal</span>
                <p className='text-right'>{idrFormatter(cartItems.total_price)}</p>
              </div>
              <p className='mb-5 text-center text-xs text-gray-500'>
                Shipping, taxes, and discount codes calculated at checkout.
              </p>

              <Checkout
                isFetching={isFetching}
                handleIsFetching={handleIsFetching}
                handleSheetClose={handleClose}
              />
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}