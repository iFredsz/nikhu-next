import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { idrFormatter } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

type Props = {
  data: {
    id: string
    name: string
    price: number
    quantity: number
    url?: string
    thumbnail?: string | null
  }
}

export default function OrderItem({ data }: Props) {
  const { thumbnail, quantity, price, name, url } = data

  const formattedPrice = idrFormatter(price)
  const totalPrice = idrFormatter(quantity * price)

  // Validasi thumbnail URL
  const isValidThumbnail = thumbnail && 
    (thumbnail.startsWith('http') || thumbnail.startsWith('/')) &&
    !thumbnail.includes('placeholder.png')

  const imageSrc = isValidThumbnail ? thumbnail : null

  const ImageContent = () => (
    <div className="w-[100px] h-[100px] flex items-center justify-center bg-gray-100 rounded">
      {imageSrc ? (
        <Image
          src={imageSrc}
          width={100}
          height={100}
          alt={name}
          className="object-cover w-full h-full"
          onError={(e) => {
            // Fallback jika gambar error
            e.currentTarget.style.display = 'none'
          }}
        />
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs text-center p-2">
          No Image
        </div>
      )}
    </div>
  )

  return (
    <Card>
      <CardHeader className='p-4'>
        <div className='flex gap-4'>
          {url ? (
            <Link href={url} className="flex gap-4">
              <ImageContent />
              <div className='flex flex-col justify-center'>
                <p className='text-base font-bold'>{name}</p>
                <p>
                  {quantity} x {formattedPrice}
                </p>
              </div>
            </Link>
          ) : (
            <div className="flex gap-4">
              <ImageContent />
              <div className='flex flex-col justify-center'>
                <p className='text-base font-bold'>{name}</p>
                <p>
                  {quantity} x {formattedPrice}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className='p-4 pt-0'>
        <Separator className='mb-4' />
        <p className='text-xs'>Total Price:</p>
        <p className='font-bold'>{totalPrice}</p>
      </CardContent>
    </Card>
  )
}