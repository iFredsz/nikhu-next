// components/orders/OrdersCard.tsx
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { firestoreDateFormatter, firstLetterUppercase, idrFormatter } from '@/lib/utils'
import OrderStatus from './OrderStatus'

type Props = {
  data: any
}

export default function OrdersCard(props: Props) {
  const { 
    date, 
    gross_amount, 
    items, 
    token, 
    order_id, 
    payment_status, 
    total_quantity, 
    bookingDetails,
    created_at,
    updated_at 
  } = props.data
  
  // Safety check untuk items dan bookingDetails
  const safeItems = items || []
  const safeBookingDetails = bookingDetails || []
  
  // Gunakan data dari bookingDetails jika ada, fallback ke items[0]
  const thumbnail = safeBookingDetails[0]?.thumbnail || safeItems[0]?.thumbnail
  const name = safeBookingDetails[0]?.name || safeItems[0]?.name

  // Gunakan updated_at atau created_at jika date adalah serverTimestamp
  let displayDate = date
  if (date && date._methodName === 'serverTimestamp') {
    displayDate = updated_at || created_at
  }
  
  const formattedDate = firestoreDateFormatter(displayDate)
  const totalOrder = idrFormatter(gross_amount || 0)

  // Validasi thumbnail URL
  const isValidThumbnail = thumbnail && 
    (thumbnail.startsWith('http') || thumbnail.startsWith('https'))

  return (
    <Link href={`/profile/orders/${order_id}`}>
      <div className='flex w-full gap-4 rounded-lg border p-4 hover:bg-gray-50 transition-colors'>
        {/* Fixed Image Container */}
        <div className='flex-shrink-0 w-20 h-20 md:w-24 md:h-24'>
          {isValidThumbnail ? (
            <div className='relative w-full h-full rounded-md overflow-hidden bg-gray-100'>
              <Image
                src={thumbnail}
                fill
                alt={name || 'product-image'}
                className='object-cover'
                sizes='(max-width: 768px) 80px, 96px'
                onError={(e) => {
                  const target = e.currentTarget
                  target.style.display = 'none'
                  const parent = target.parentElement
                  if (parent) {
                    parent.innerHTML = '<div class="flex h-full w-full items-center justify-center bg-gray-200 rounded-md"><span class="text-xs text-gray-500">No Image</span></div>'
                  }
                }}
              />
            </div>
          ) : (
            <div className='flex h-full w-full items-center justify-center bg-gray-200 rounded-md'>
              <span className='text-xs text-gray-500'>No Image</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className='flex flex-1 flex-col min-w-0'>
          <div className='mb-1 flex justify-between gap-2'>
            <p className='text-[#929292] text-sm truncate'>{formattedDate}</p>
            <OrderStatus status={payment_status} />
          </div>
          <div className='flex flex-1 flex-col justify-between'>
            <div className='mb-4'>
              <p className='text-base font-bold line-clamp-2'>{name || 'Product Name'}</p>
              {/* Tampilkan jumlah produk dari bookingDetails atau items */}
              {safeBookingDetails.length > 1 && (
                <p className='text-xs text-gray-600 mt-1'>+{safeBookingDetails.length - 1} other products</p>
              )}
              {safeBookingDetails.length <= 1 && safeItems.length > 1 && (
                <p className='text-xs text-gray-600 mt-1'>+{safeItems.length - 1} other products</p>
              )}
            </div>
            <div>
              <Separator className='mb-2' />
              <p className='text-xs text-gray-600'>Total Order:</p>
              <p className='font-bold text-lg'>{totalOrder}</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}