import serverUid from '@/lib/actions/auth/server-uid'
import OrdersContainer from '@/components/orders/OrdersContainer'

export default async function Page() {
  const uid = (await serverUid()) as string

  return (
    <>
      <h1 className='text-2xl mt-4 mb-4'>My Orders</h1>
      <OrdersContainer uid={uid} />
    </>
  )
}
