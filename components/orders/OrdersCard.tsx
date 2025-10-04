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
  const { date, gross_amount, items, token, order_id, payment_status, total_quantity, bookingDetails } = props.data
  
  // Gunakan thumbnail dari bookingDetails jika ada, fallback ke items[0]
  const thumbnail = bookingDetails?.[0]?.thumbnail || items[0]?.thumbnail
  const name = bookingDetails?.[0]?.name || items[0]?.name

  const formattedDate = firestoreDateFormatter(date)
  const totalOrder = idrFormatter(gross_amount)

  // Validasi thumbnail URL
  const isValidThumbnail = thumbnail && 
    (thumbnail.startsWith('http') || thumbnail.startsWith('https'))

  return (
    <Link href={`/profile/orders/${order_id}`}>
      <div className='flex w-full gap-4 rounded-lg border p-4'>
        <div className='max-w-[70px] md:max-w-[150px]'>
          {isValidThumbnail ? (
            <Image
              src={thumbnail}
              width={150}
              height={150}
              alt={name || 'product-image'}
              className='h-full w-full object-cover'
              onError={(e) => {
                // Fallback jika image error
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center bg-gray-200'>
              <span className='text-xs text-gray-500'>No Image</span>
            </div>
          )}
        </div>
        <div className='flex flex-1 flex-col'>
          <div className='mb-1 flex justify-between'>
            <p className='text-[#929292]'>{formattedDate}</p>
            <OrderStatus status={payment_status} />
          </div>
          <div className='flex flex-1 flex-col justify-between'>
            <div className='mb-4'>
              <p className='text-base font-bold'>{name || 'Product Name'}</p>
              {items.length > 1 && <p className='text-xs'>+{items.length - 1} other products</p>}
            </div>
            <div>
              <Separator className='mb-2' />
              <p className='text-xs'>Total Order:</p>
              <p className='font-bold'>{totalOrder}</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}