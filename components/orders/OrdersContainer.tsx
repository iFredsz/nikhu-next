'use client'

import OrdersCard from './OrdersCard'
import OrdersEmptyPlaceholder from './OrdersEmptyPlaceholder'
import { useQuery } from '@tanstack/react-query'
import { getOrders } from '@/lib/actions/firestore/get-orders'
import LoadingText from '../LoadingText'

type Props = {
  uid: string
}

export default function OrdersContainer(props: Props) {
  const uid = props.uid
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['orders', uid], // tambahkan uid ke queryKey
    queryFn: async () => await getOrders(uid),
  })

  if (isLoading) {
    return (
      <div className='flex w-full justify-center pt-8'>
        <LoadingText />
      </div>
    )
  }

  if (isError) {
    console.error('Error fetching orders:', error)
    return (
      <div className='pt-8 text-center text-red-600'>
        Error loading orders. Please try again.
      </div>
    )
  }

  // Perbaikan: cek jika data tidak ada atau array kosong
  if (!data || data.length === 0) {
    return <OrdersEmptyPlaceholder />
  }

  return (
    <div className='flex flex-col gap-4'>
      {data.map((order: any) => (
        <OrdersCard key={order.order_id} data={order} />
      ))}
    </div>
  )
}