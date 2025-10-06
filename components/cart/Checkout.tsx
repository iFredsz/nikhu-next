import useCartStore from '@/store/cart-store'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import ky from 'ky'
import LoadingText from '../LoadingText'
import { useSession } from 'next-auth/react'
import { ExtendedCartItems } from './Cart'

type Props = {
  isFetching: boolean
  handleIsFetching: (state: boolean) => void
  handleSheetClose: () => void
}

type AvailabilityResponse = {
  available: boolean
  conflictingBookings?: Array<{
    date: string
    times: string[]
    productName?: string
  }>
}

export default function Checkout(props: Props) {
  const { isFetching, handleIsFetching, handleSheetClose } = props
  const { cartItemsStore, clearCart } = useCartStore()
  const router = useRouter()
  const session = useSession()

  const checkBookingAvailability = async (): Promise<AvailabilityResponse> => {
    try {
      const response = await ky.post('/api/check-booking-availability', { 
        json: { cartItems: cartItemsStore }
      }).json() as AvailabilityResponse
      
      return response
    } catch (error) {
      console.error('Error checking booking availability:', error)
      return { available: false }
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

    // Check booking availability first
    const availability = await checkBookingAvailability()
    if (!availability.available) {
      const errorMessage = availability.conflictingBookings 
        ? formatConflictMessage(availability.conflictingBookings)
        : 'Cannot checkout! Some items are already booked at the selected date and times.'
      
      toast.error(errorMessage, {
        duration: 10000, // 10 seconds
        style: { whiteSpace: 'pre-line' }
      })
      return
    }

    handleIsFetching(true)
    try {
      const newOrder: { orderId: string } = await ky
        .post('/api/midtrans/create-order', { json: cartItemsStore })
        .json()

      // executed if order is successfully created
      handleIsFetching(false)
      handleSheetClose()
      clearCart()
      toast.success('Order has been created!')
      router.push(`/profile/orders/${newOrder.orderId}`)
    } catch (error) {
      handleIsFetching(false)
      console.log(error)
      toast.error('Something went wrong when placing the order...')
    }
  }

  return (
    <>
      <Button className='w-full' disabled={isFetching} onClick={handleCheckout}>
        {isFetching ? <LoadingText /> : 'Checkout'}
      </Button>
    </>
  )
}