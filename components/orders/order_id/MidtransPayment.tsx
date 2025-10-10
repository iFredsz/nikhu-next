import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useLayoutEffect, useState, useEffect, useRef } from 'react'
import { collection, getDocs, onSnapshot, doc, getDoc, collectionGroup } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { toast } from 'sonner'

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
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Realtime check untuk konflik booking dengan collectionGroup listener
  useEffect(() => {
    console.log('=== 🚀 MIDTRANS PAYMENT MOUNTED ===')
    console.log('Order ID:', order_id)
    console.log('User ID:', uid)

    let currentOrderData: any = null

    // Function untuk get current order data
    const getCurrentOrderData = async () => {
      try {
        const orderRef = doc(db, 'users', uid, 'orders', order_id)
        const orderSnap = await getDoc(orderRef)
        
        if (!orderSnap.exists()) {
          console.log('❌ Order not found')
          return null
        }

        const orderData = orderSnap.data()
        console.log('✅ Current order data:', orderData)
        console.log('   Payment status:', orderData.payment_status)
        console.log('   Has original_cart_items?', !!orderData.original_cart_items)
        
        return orderData
      } catch (error) {
        console.error('Error fetching current order:', error)
        return null
      }
    }

    // Function untuk check conflicts dengan debounce
    const checkConflicts = async () => {
      // Clear timeout sebelumnya untuk debounce
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current)
      }

      // Debounce 300ms untuk menghindari multiple checks simultan
      checkTimeoutRef.current = setTimeout(async () => {
        try {
          console.log('\n=== 🔍 STARTING CONFLICT CHECK ===')
          console.log('Timestamp:', new Date().toISOString())
          
          // Get current order data - selalu fresh
          currentOrderData = await getCurrentOrderData()
          
          if (!currentOrderData) {
            console.log('❌ Cannot get current order data')
            setIsChecking(false)
            setIsSlotTaken(false)
            return
          }

          // PENTING: Jika payment_status bukan pending, hide button
          if (currentOrderData.payment_status !== 'pending') {
            console.log(`⚠️ Payment status is ${currentOrderData.payment_status}, hiding button`)
            setIsChecking(false)
            setIsSlotTaken(true) // Hide button
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
              console.log(`    Is Current Order: ${orderDocId === order_id}`)

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
                console.log(`      Date: ${otherDate}`)
                console.log(`      Times: ${JSON.stringify(otherTimes)}`)

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

                  // Check date match
                  if (otherDate === slotToCheck.date) {
                    console.log('        ✅ DATE MATCH!')
                    
                    // Check time overlap
                    const overlapping: string[] = []
                    
                    for (const otherTime of otherTimes) {
                      for (const currentTime of slotToCheck.times) {
                        const trimmedOtherTime = String(otherTime).trim()
                        const trimmedCurrentTime = String(currentTime).trim()
                        
                        if (trimmedOtherTime === trimmedCurrentTime) {
                          overlapping.push(otherTime)
                          console.log(`          ✅ TIME MATCH FOUND: ${otherTime}`)
                        }
                      }
                    }

                    console.log(`        📊 Total overlapping times: ${overlapping.length}`)

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
                      console.log('        ✅ NO TIME OVERLAP')
                    }
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
      }, 300)
    }

    // Load current order data first
    getCurrentOrderData().then((data) => {
      currentOrderData = data
      // Run initial check
      checkConflicts()
    })

    // Setup realtime listener menggunakan collectionGroup untuk mendengarkan SEMUA orders
    const ordersQuery = collectionGroup(db, 'orders')
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      console.log('🔄 Orders collection updated - Changes detected!')
      console.log(`   ${snapshot.docChanges().length} changes detected`)
      
      let shouldRecheck = false
      
      snapshot.docChanges().forEach((change) => {
        const orderData = change.doc.data()
        const orderPath = change.doc.ref.path
        
        console.log(`   Type: ${change.type}`)
        console.log(`   Order Path: ${orderPath}`)
        console.log(`   Payment Status: ${orderData.payment_status}`)
        
        // Skip jika ini current order (akan dihandle oleh listener terpisah)
        if (change.doc.id === order_id) {
          console.log('   ⏭️  SKIP: Current order (handled by separate listener)')
          return
        }

        // Recheck jika ada perubahan pada order lain yang:
        // 1. Berubah MENJADI success (conflict baru muncul)
        // 2. Berubah DARI success ke status lain (conflict hilang)
        if (change.type === 'modified') {
          console.log('   ⚠️  ORDER MODIFIED - Rechecking conflicts...')
          shouldRecheck = true
        } else if (change.type === 'added' && orderData.payment_status === 'success') {
          console.log('   ⚠️  NEW SUCCESS ORDER - Rechecking conflicts...')
          shouldRecheck = true
        }
      })
      
      if (shouldRecheck) {
        checkConflicts()
      }
    }, (error) => {
      console.error('❌ Error in orders listener:', error)
    })

    // Setup realtime listener on current order untuk detect status changes
    const currentOrderRef = doc(db, 'users', uid, 'orders', order_id)
    const unsubscribeCurrentOrder = onSnapshot(currentOrderRef, (doc) => {
      if (doc.exists()) {
        const newData = doc.data()
        console.log('🔄 Current order updated')
        console.log('   New status:', newData.payment_status)
        
        // Update current order data
        currentOrderData = newData
        
        // Recheck untuk update UI
        checkConflicts()
      }
    })

    return () => {
      console.log('🧹 Cleanup listeners')
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current)
      }
      unsubscribeCurrentOrder()
      unsubscribeOrders()
    }
  }, [uid, order_id])

  const handleMidtransSnap = () => {
    setIsOpen(true)
    window.snap.embed(token, {
      embedId: 'snap-container',
      onSuccess: function (result: any) {
        setIsOpen(false)
        toast.success('Pembayaran Berhasil!', {
          description: 'Terima kasih telah melakukan pembayaran.',
          duration: 3000,
        })
        setTimeout(() => {
          router.push(`/transaction-status?order_id=${order_id}&status_code=200&transaction_status=settlement`)
        }, 1000)
      },
      onPending: function (result: any) {
        setIsOpen(false)
        toast.info('Menunggu Pembayaran', {
          description: 'Pembayaran Anda sedang diproses.',
          duration: 3000,
        })
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      },
      onError: function (result: any) {
        setIsOpen(false)
        toast.error('Pembayaran Gagal', {
          description: 'Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.',
          duration: 4000,
        })
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      },
      onClose: function () {
        setIsOpen(false)
        toast.warning('Pembayaran Dibatalkan', {
          description: 'Anda menutup jendela pembayaran.',
          duration: 3000,
        })
        setTimeout(() => {
          window.location.reload()
        }, 1500)
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
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
        <p className="text-gray-600">Memeriksa ketersediaan slot booking...</p>
      </div>
    )
  }

  // Slot sudah diambil user lain
  if (isSlotTaken) {
    return (
      <div className="my-8">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-semibold text-center">
            ⚠️ Maaf, slot booking yang Anda pilih sudah diambil oleh orang lain atau sudah kadaluarsa.
          </p>
          <p className="text-red-600 text-sm text-center mt-2">
            Silakan order ulang untuk memilih slot yang masih tersedia.
          </p>
          {debugInfo.length > 0 && (
            <div className="mt-4 text-xs text-red-600">
              <p className="font-semibold">Sudah booked pada:</p>
              {debugInfo.map((info, idx) => (
                <div key={idx} className="mt-2">
                  <p>• Tanggal: {info.date}</p>
                  <p>• Waktu: {info.overlappingTimes.join(', ')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      {!isOpen && (
        <>
          <div className='my-8 flex justify-between items-center'>
            <div>
              <p className='mb-1 font-medium'>Payment Link</p>
              <p className='text-xs text-gray-500'>Slot tersedia - Klik untuk melanjutkan pembayaran</p>
            </div>
            <Button onClick={handleMidtransSnap}>Click Here</Button>
          </div>
        </>
      )}
      {isOpen && (
        <>
          <p className="mt-8 text-center text-lg">
            Please <strong>complete your payment using the available options below.</strong>
          </p>
          <p className="mb-8 mt-4 text-center text-sm text-gray-600">
            Thank you for using our service.
          </p>
        </>
      )}

      <div id='snap-container' className={`w-full ${isOpen ? 'border' : ''}`}></div>
    </>
  )
}