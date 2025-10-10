import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useLayoutEffect, useState, useEffect } from 'react'
import { collection, getDocs, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

type Props = {
  token: string
  order_id: string
  uid: string
}

export default function MidtransPayment(props: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSlotTaken, setIsSlotTaken] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [debugInfo, setDebugInfo] = useState<any[]>([])
  const { token, order_id, uid } = props
  const router = useRouter()

  // Realtime check untuk konflik booking
  useEffect(() => {
    console.log('=== 🚀 MIDTRANS PAYMENT MOUNTED ===')
    console.log('Order ID:', order_id)
    console.log('User ID:', uid)

    // Function untuk get current order data langsung dari Firestore
    const getCurrentOrderData = async () => {
      try {
        const orderRef = doc(db, 'users', uid, 'orders', order_id)
        const orderSnap = await getDoc(orderRef)
        
        if (!orderSnap.exists()) {
          console.log('❌ Order not found')
          return null
        }

        const orderData = orderSnap.data()
        console.log('✅ Current order data from Firestore:', orderData)
        console.log('Has original_cart_items?', !!orderData.original_cart_items)
        console.log('original_cart_items:', orderData.original_cart_items)
        
        return orderData
      } catch (error) {
        console.error('Error fetching current order:', error)
        return null
      }
    }

    // Function untuk check conflicts
    const checkConflicts = async () => {
      try {
        console.log('\n=== 🔍 STARTING CONFLICT CHECK ===')
        
        // Get current order data
        const currentOrderData = await getCurrentOrderData()
        
        if (!currentOrderData) {
          console.log('❌ Cannot get current order data')
          setIsChecking(false)
          setIsSlotTaken(false)
          return
        }

        // Check original_cart_items
        if (!currentOrderData.original_cart_items || currentOrderData.original_cart_items.length === 0) {
          console.log('❌ No original_cart_items - Button akan muncul')
          setIsChecking(false)
          setIsSlotTaken(false)
          return
        }

        const currentCartItems = currentOrderData.original_cart_items
        console.log('✅ Original Cart Items found:', currentCartItems)

        // Extract date dan times yang perlu dicek
        const slotsToCheck = currentCartItems.map((item: any) => ({
          date: item.date,
          times: item.times || [],
          name: item.name
        }))

        console.log('📋 Slots to check for conflicts:', slotsToCheck)

        // Get all users
        const usersRef = collection(db, 'users')
        const usersSnapshot = await getDocs(usersRef)
        
        console.log('Total users found:', usersSnapshot.docs.length)

        const debugData: any[] = []
        let conflictFound = false

        for (const userDoc of usersSnapshot.docs) {
          const userId = userDoc.id
          console.log(`\n--- Checking User: ${userId} ---`)

          // Get all orders dari user ini
          const ordersRef = collection(db, 'users', userId, 'orders')
          const ordersSnapshot = await getDocs(ordersRef)
          
          console.log(`  Orders count: ${ordersSnapshot.docs.length}`)

          for (const orderDoc of ordersSnapshot.docs) {
            const orderData = orderDoc.data()
            const orderDocId = orderDoc.id
            
            console.log(`  \n  Order ID: ${orderDocId}`)
            console.log(`    Payment Status: ${orderData.payment_status}`)

            // Skip jika bukan success
            if (orderData.payment_status !== 'success') {
              console.log('    ⏭️  SKIP: Not success')
              continue
            }

            // Skip jika ini order saat ini
            if (orderDocId === order_id) {
              console.log('    ⏭️  SKIP: Current order')
              continue
            }

            console.log('    ✅ This is a SUCCESS order from another user/session!')

            // Check original_cart_items
            const otherCartItems = orderData.original_cart_items
            
            if (!otherCartItems || !Array.isArray(otherCartItems)) {
              console.log('    ⏭️  SKIP: No original_cart_items')
              continue
            }

            console.log('    Cart Items:', otherCartItems)

            // Compare dengan current slots
            for (const otherItem of otherCartItems) {
              const otherDate = otherItem.date
              const otherTimes = otherItem.times

              console.log(`    \n    Checking item:`)
              console.log(`      Date: ${otherDate} (type: ${typeof otherDate})`)
              console.log(`      Times: ${JSON.stringify(otherTimes)} (isArray: ${Array.isArray(otherTimes)})`)

              // Validate
              if (typeof otherDate !== 'string' || !Array.isArray(otherTimes) || otherTimes.length === 0) {
                console.log('      ⏭️  Invalid format')
                continue
              }

              // Compare dengan setiap slot yang perlu dicek
              for (const slotToCheck of slotsToCheck) {
                console.log(`      \n      ========== COMPARISON ==========`)
                console.log(`      📅 Other Date: "${otherDate}"`)
                console.log(`      📅 Current Date: "${slotToCheck.date}"`)
                console.log(`      🕐 Other Times:`, otherTimes)
                console.log(`      🕐 Current Times:`, slotToCheck.times)

                // Check date match
                if (otherDate === slotToCheck.date) {
                  console.log('        ✅ DATE MATCH!')
                  
                  // Check time overlap - HARUS ADA MINIMAL 1 WAKTU YANG SAMA
                  const overlapping: string[] = []
                  
                  console.log('        Checking each time combination:')
                  for (const otherTime of otherTimes) {
                    for (const currentTime of slotToCheck.times) {
                      const trimmedOtherTime = String(otherTime).trim()
                      const trimmedCurrentTime = String(currentTime).trim()
                      
                      console.log(`          "${trimmedOtherTime}" === "${trimmedCurrentTime}" ? ${trimmedOtherTime === trimmedCurrentTime}`)
                      
                      if (trimmedOtherTime === trimmedCurrentTime) {
                        overlapping.push(otherTime)
                        console.log(`          ✅ TIME MATCH FOUND: ${otherTime}`)
                      }
                    }
                  }

                  console.log(`        📊 Total overlapping times: ${overlapping.length}`)
                  console.log(`        📋 Overlapping list:`, overlapping)

                  if (overlapping.length > 0) {
                    console.log('        🚫 CONFLICT DETECTED!')
                    conflictFound = true
                    
                    debugData.push({
                      conflictingOrderId: orderDocId,
                      conflictingUserId: userId,
                      date: otherDate,
                      overlappingTimes: overlapping,
                      productName: otherItem.name,
                      allOtherTimes: otherTimes,
                      allCurrentTimes: slotToCheck.times
                    })

                    break
                  } else {
                    console.log('        ✅ NO TIME OVERLAP - Different times, slot available!')
                  }
                } else {
                  console.log('        ❌ DATE MISMATCH - Different dates')
                  console.log(`          "${otherDate}" !== "${slotToCheck.date}"`)
                }
                console.log(`      ================================\n`)
              }

              if (conflictFound) break
            }

            if (conflictFound) break
          }

          if (conflictFound) break
        }

        console.log('\n=== 📊 FINAL RESULT ===')
        console.log('Conflict Found:', conflictFound)
        console.log('Debug Data:', debugData)

        setDebugInfo(debugData)
        setIsSlotTaken(conflictFound)
        setIsChecking(false)

        if (conflictFound) {
          console.log('⚠️  HIDING BUTTON - Slot taken!')
        } else {
          console.log('✅ SHOWING BUTTON - Slot available!')
        }

      } catch (error) {
        console.error('❌ Error checking conflicts:', error)
        setIsChecking(false)
        setIsSlotTaken(false)
      }
    }

    // Run initial check
    checkConflicts()

    // Setup realtime listener on current order untuk detect status changes
    const currentOrderRef = doc(db, 'users', uid, 'orders', order_id)
    const unsubscribeCurrentOrder = onSnapshot(currentOrderRef, () => {
      console.log('🔄 Current order updated - Rechecking conflicts...')
      checkConflicts()
    })

    // Setup realtime listener on users collection untuk detect perubahan
    const usersRef = collection(db, 'users')
    const unsubscribeUsers = onSnapshot(usersRef, () => {
      console.log('🔄 Users collection updated - Rechecking conflicts...')
      checkConflicts()
    })

    return () => {
      console.log('🧹 Cleanup listeners')
      unsubscribeCurrentOrder()
      unsubscribeUsers()
    }
  }, [uid, order_id])

  const handleMidtransSnap = () => {
    setIsOpen(true)
    window.snap.embed(token, {
      embedId: 'snap-container',
      onSuccess: function (result: any) {
        setIsOpen(false)
        alert('Payment success!')
        router.push(`/transaction-status?order_id=${order_id}&status_code=200&transaction_status=settlement`)
      },
      onPending: function (result: any) {
        setIsOpen(false)
        alert('Waiting for payment...')
        window.location.reload()
      },
      onError: function (result: any) {
        setIsOpen(false)
        alert('Payment failed somehow..')
        window.location.reload()
      },
      onClose: function () {
        setIsOpen(false)
        alert('Midtrans payment closed.')
        window.location.reload()
      },
    })
  }

  useLayoutEffect(() => {
    // inject Midtrans Snap script
    const script = document.createElement('script')
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js'
    script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT as string)
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="my-8 text-center">
        <p className="text-gray-600">Memeriksa ketersediaan slot booking...</p>
        <p className="text-xs text-gray-400 mt-2">Buka Console (F12) untuk melihat detail proses</p>
      </div>
    )
  }

  // Slot sudah diambil user lain
  if (isSlotTaken) {
    return (
      <div className="my-8">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-semibold text-center">
            ⚠️ Maaf, slot booking yang Anda pilih sudah diambil oleh user lain.
          </p>
          <p className="text-red-600 text-sm text-center mt-2">
            Silakan pilih tanggal dan waktu yang berbeda.
          </p>
        </div>
        
      </div>
    )
  }

  return (
    <>
      {!isOpen && (
        <>
          <div className='my-8 flex justify-between'>
            <p className='mb-2'>Payment Link</p>
            <Button onClick={handleMidtransSnap}>Click Here</Button>
          </div>
          
          {/* Debug Info */}
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer hover:text-gray-700">
              🔍 Debug Info
            </summary>
            <pre className="mt-2 p-3 bg-gray-50 rounded overflow-auto text-xs max-h-60">
              {JSON.stringify({
                status: 'No conflicts found - Slot available',
                debugInfo
              }, null, 2)}
            </pre>
          </details>
        </>
      )}
      {isOpen && (
        <>
          <p className="mt-8 text-center text-lg">
            Please <strong>complete your payment using the available options below.</strong>
          </p>
          <p className="mb-8 mt-4 text-center text-lg">
            Thank you for using our service.
          </p>
        </>
      )}

      <div id='snap-container' className={`w-full ${isOpen ? 'border' : ''}`}></div>
    </>
  )
}