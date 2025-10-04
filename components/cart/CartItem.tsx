import Image from 'next/image'
import Link from 'next/link'
import { idrFormatter } from '@/lib/utils'
import useCartStore from '@/store/cart-store'
import { ExtendedCartItems } from './Cart'
import { Button } from '../ui/button'
import { Trash2 } from 'lucide-react'

type PropsType = {
  data: ExtendedCartItems
  isFetching: boolean
  handleSheetClose: () => void
}

export default function CartItem(props: PropsType) {
  const { removeItemFromCart } = useCartStore()
  const { 
    id, 
    name, 
    price, 
    thumbnail, 
    quantity, 
    slug, 
    addons, 
    total, 
    date, 
    times,
    people = 1,
    voucherDiscount = 0,
    customerName,
    customerWa
  } = props.data

  const handleRemove = () => {
    removeItemFromCart(id)
  }

  return (
    <div className='flex gap-4 border-b pb-4'>
      <div className='max-w-[90px]'>
        <Link href={`/products/${slug ?? ''}`} onClick={props.handleSheetClose}>
          {thumbnail ? (
            <Image
              src={thumbnail}
              width={90}
              height={90}
              alt={name}
              className='object-cover rounded-md'
            />
          ) : (
            <div className='w-[90px] h-[90px] bg-gray-100 flex items-center justify-center text-xs text-gray-500 rounded-md'>
              No image
            </div>
          )}
        </Link>
      </div>

      <div className='flex flex-1 flex-col justify-between'>
        <div className='flex justify-between items-start'>
          <Link
            href={`/products/${slug ?? ''}`}
            className='font-bold hover:text-blue-600'
            onClick={props.handleSheetClose}
          >
            {name}
          </Link>
          
          <Button
            onClick={handleRemove}
            className='h-8 w-8 cursor-pointer p-0'
            variant='outline'
            disabled={props.isFetching}
          >
            <Trash2 size={14} />
          </Button>
        </div>

        {/* Informasi Booking */}
        <div className='text-sm text-gray-600 mt-2 space-y-1'>
          {date && <p>Tanggal: {date}</p>}
          {times && times.length > 0 && <p>Sesi: {times.join(', ')}</p>}
          {people > 0 && <p>Jumlah Orang: {people}</p>}
          <p>Jumlah Sesi: {times?.length || 0} sesi</p>
        </div>

        {/* Addons */}
        {addons && addons.length > 0 && (
          <div className='mt-2'>
            <p className='text-sm font-medium text-gray-800'>Tambahan:</p>
            <ul className='text-xs text-gray-600 mt-1 space-y-1'>
              {addons.map((addon, index) => {
                if (addon.type === 'fixed' && addon.qty > 0) {
                  return (
                    <li key={index}>
                      • {addon.name} - {idrFormatter(addon.price)} × {people} orang × {times?.length || 1} sesi
                    </li>
                  )
                } else if (addon.type === 'per_item' && addon.selectedSessions) {
                  return Object.entries(addon.selectedSessions)
                    .filter(([_, qty]) => qty > 0)
                    .map(([session, qty]) => (
                      <li key={`${index}-${session}`}>
                        • {addon.name} ({session}) - {idrFormatter(addon.price)} × {qty}
                      </li>
                    ))
                }
                return null
              }).flat().filter(Boolean)}
            </ul>
          </div>
        )}

        {/* Voucher Discount */}
        {voucherDiscount > 0 && (
          <div className='mt-1'>
            <p className='text-xs text-green-600'>
              Diskon: -{idrFormatter(voucherDiscount)}
            </p>
          </div>
        )}

        {/* Total Harga */}
        <div className='mt-2 text-sm'>
          <div className='flex justify-between items-center'>
            <span className='font-semibold'>Total:</span>
            <span className='font-bold text-lg'>{idrFormatter(total)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}