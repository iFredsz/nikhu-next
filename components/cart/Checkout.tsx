import useCartStore from '@/store/cart-store'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import ky from 'ky'
import LoadingText from '../LoadingText'
import { useSession } from 'next-auth/react'
import { ExtendedCartItems } from './Cart'
import { useState } from 'react'

type Props = {
  isFetching: boolean
  handleIsFetching: (state: boolean) => void
  handleSheetClose: () => void
  cartItems: ExtendedCartItems[]
}

interface AvailabilityResponse {
  available: boolean
  conflictingBookings?: Array<{
    date: string
    times: string[]
    productName?: string
  }>
}

interface CreateOrderResponse {
  success: boolean
  orderId: string
  token: string
  redirect_url: string
}

interface ErrorResponse {
  error: string
  details?: string
}

export default function Checkout(props: Props) {
  const { isFetching, handleIsFetching, handleSheetClose, cartItems } = props
  const { clearCart } = useCartStore()
  const router = useRouter()
  const session = useSession()
  const [isChecking, setIsChecking] = useState(false)

  const checkBookingAvailability = async (): Promise<AvailabilityResponse> => {
    try {
      console.log('Checking availability for cart items:', cartItems)
      
      const response = await ky.post('/api/check-booking-availability', { 
        json: { cartItems },
        timeout: 30000 // 30 second timeout
      }).json() as AvailabilityResponse
      
      console.log('Availability response:', response)
      return response
    } catch (error) {
      console.error('Error checking booking availability:', error)
      return { 
        available: false,
        conflictingBookings: [{ date: 'Unknown', times: ['Unknown'], productName: 'Error checking availability' }]
      }
    }
  }

  const formatConflictMessage = (conflictingBookings: Array<{date: string, times: string[], productName?: string}>): string => {
    if (conflictingBookings.length === 0) return ''

    const conflicts = conflictingBookings.map(conflict => {
      const date = conflict.date
      const times = conflict.times.join(', ')
      const productInfo = conflict.productName ? ` untuk ${conflict.productName}` : ''
      return `• ${date} jam ${times}${productInfo}`
    }).join('\n')

    return `Cannot checkout! Item sudah dibooking pada:\n${conflicts}`
  }

  const handleCheckout = async () => {
    if (!session.data) {
      handleSheetClose()
      toast.info('Please login before proceed to checkout.')
      router.push('/login')
      return
    }

    // Validasi cart items sebelum checkout
    if (cartItems.length === 0) {
      toast.error('Cart is empty')
      return
    }

    // Validasi setiap item memiliki data yang diperlukan
    const invalidItems = cartItems.filter(item => 
      !item.date || 
      !item.times || 
      !Array.isArray(item.times) || 
      item.times.length === 0
    )

    if (invalidItems.length > 0) {
      toast.error('Some items in cart are invalid. Please remove and re-add them.')
      return
    }

    setIsChecking(true)
    handleIsFetching(true)

    try {
      // Check booking availability first
      console.log('Starting availability check...')
      const availability = await checkBookingAvailability()
      console.log('Availability check completed:', availability)
      
      if (!availability.available) {
        const errorMessage = availability.conflictingBookings 
          ? formatConflictMessage(availability.conflictingBookings)
          : 'Cannot checkout! Some items are already booked at the selected date and times.'
        
        toast.error(errorMessage, {
          duration: 10000, // 10 seconds
          style: { whiteSpace: 'pre-line' }
        })
        setIsChecking(false)
        handleIsFetching(false)
        return
      }

      console.log('Creating order...')
      // Create order
      const response = await ky.post('/api/midtrans/create-order', { 
        json: cartItems,
        timeout: 30000
      })

      if (!response.ok) {
        const errorData = await response.json() as ErrorResponse
        throw new Error(errorData.error || 'Failed to create order')
      }

      const newOrder = await response.json() as CreateOrderResponse
      console.log('Order created successfully:', newOrder)

      // executed if order is successfully created
      handleIsFetching(false)
      setIsChecking(false)
      handleSheetClose()
      clearCart()
      toast.success('Order has been created!')
      
      if (newOrder.orderId) {
        router.push(`/profile/orders/${newOrder.orderId}`)
      } else {
        router.push('/profile/orders')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      setIsChecking(false)
      handleIsFetching(false)
      
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('Network')) {
          toast.error('Network timeout. Please try again.')
        } else {
          toast.error(error.message || 'Something went wrong when placing the order...')
        }
      } else {
        toast.error('Something went wrong when placing the order...')
      }
    }
  }

  const isDisabled = isFetching || isChecking || cartItems.length === 0

  return (
    <>
      <Button className='w-full' disabled={isDisabled} onClick={handleCheckout}>
        {isFetching || isChecking ? <LoadingText /> : 'Checkout'}
      </Button>
    </>
  )
}