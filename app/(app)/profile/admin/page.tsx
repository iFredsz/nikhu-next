import serverUid from '@/lib/actions/auth/server-uid'
import OrdersFull from '@/components/orders/OrdersFull'

export default async function Page() {
  const uid = (await serverUid()) as string

  return (
    <>
      <OrdersFull />
    </>
  )
}
