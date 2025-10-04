'use client'

import useCartStore from '@/store/cart-store'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import ky from 'ky'
import LoadingText from '../LoadingText'
import { useSession } from 'next-auth/react'

type Props = {
  isFetching: boolean
  handleIsFetching: (state: boolean) => void
  handleSheetClose: () => void
}

export default function Checkout(props: Props) {
  const { isFetching, handleIsFetching, handleSheetClose } = props
  const { cartItemsStore, clearCart } = useCartStore()
  const router = useRouter()
  const session = useSession()

  const handleCheckout = async () => {
    if (!session.data) {
      handleSheetClose()
      toast.info('Please login before proceed to checkout.')
      router.push('/login')
      return
    }

    if (cartItemsStore.length === 0) {
      toast.error('Cart is empty!')
      return
    }

    handleIsFetching(true)

    try {
      const response = await ky
        .post('/api/midtrans/create-order', { 
          json: { items: cartItemsStore },
          timeout: 30000,
          throwHttpErrors: false
        })
        .json()

      // Type guard untuk response
      if (typeof response === 'object' && response !== null) {
        const orderResponse = response as { 
          orderId?: string; 
          token?: string; 
          redirect_url?: string;
          error?: string;
        }

        if (orderResponse.error) {
          throw new Error(orderResponse.error)
        }

        if (!orderResponse.orderId) {
          throw new Error('No order ID received from server')
        }

        handleIsFetching(false)
        handleSheetClose()
        clearCart()

        // **PERUBAHAN UTAMA: Selalu redirect ke halaman order**
        toast.success('Order created successfully!')
        router.push(`/profile/orders/${orderResponse.orderId}`)
        
        return
      }

      throw new Error('Unexpected response format from server')

    } catch (error: any) {
      handleIsFetching(false)
      console.error('Checkout error:', error)
      
      if (error.name === 'TimeoutError') {
        toast.error('Request timeout. Please try again.')
      } else {
        toast.error(error.message || 'Payment failed. Please try again.')
      }
    }
  }

  return (
    <Button className='w-full' disabled={isFetching} onClick={handleCheckout}>
      {isFetching ? <LoadingText /> : 'Checkout'}
    </Button>
  )
}