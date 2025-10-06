import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/app/firebase-admin'
import { ExtendedCartItems } from '@/components/cart/Cart'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cartItems } = body as { cartItems: ExtendedCartItems[] }

    console.log('Received cart items:', cartItems)

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ available: true })
    }

    // Validate cart items structure
    const validCartItems = cartItems.filter(item => 
      item && typeof item === 'object' && item.date && item.times
    )

    if (validCartItems.length === 0) {
      return NextResponse.json({ available: true })
    }

    const conflictingBookings: Array<{date: string, times: string[], productName?: string}> = []

    // Get all users
    const usersSnapshot = await adminDb.collection('users').get()
    
    console.log(`Found ${usersSnapshot.size} users`)

    // Check each cart item against existing orders from all users
    for (const cartItem of validCartItems) {
      if (!cartItem.date || !cartItem.times || cartItem.times.length === 0) {
        continue
      }

      console.log(`Checking cart item: ${cartItem.name} on ${cartItem.date} at ${cartItem.times.join(', ')}`)

      // Check orders for each user
      for (const userDoc of usersSnapshot.docs) {
        try {
          const ordersSnapshot = await adminDb
            .collection('users')
            .doc(userDoc.id)
            .collection('orders')
            .where('payment_status', '==', 'success')
            .get()

          for (const orderDoc of ordersSnapshot.docs) {
            const orderData = orderDoc.data()
            
            // Check if this order has original_cart_items
            if (orderData.original_cart_items && Array.isArray(orderData.original_cart_items)) {
              for (const orderItem of orderData.original_cart_items) {
                // Skip if order item doesn't have required properties
                if (!orderItem || !orderItem.date || !orderItem.times) {
                  continue
                }

                // Skip if different date
                if (orderItem.date !== cartItem.date) continue

                console.log(`Found order with same date: ${orderItem.date}`)

                // Check for time conflicts
                const orderTimes: string[] = Array.isArray(orderItem.times) ? orderItem.times : []
                const cartTimes: string[] = Array.isArray(cartItem.times) ? cartItem.times : []
                
                const timeConflicts = orderTimes.filter((time: string) => 
                  cartTimes.includes(time)
                )
                
                if (timeConflicts.length > 0) {
                  console.log(`Time conflicts found: ${timeConflicts.join(', ')}`)
                  conflictingBookings.push({
                    date: cartItem.date,
                    times: timeConflicts,
                    productName: cartItem.name || 'Unknown Product'
                  })
                }
              }
            }
          }
        } catch (userError) {
          console.error(`Error processing user ${userDoc.id}:`, userError)
          continue // Skip this user and continue with others
        }
      }
    }

    // Remove duplicate conflicts
    const uniqueConflicts = conflictingBookings.filter((conflict, index, self) => 
      index === self.findIndex(c => 
        c.date === conflict.date && 
        c.times.join() === conflict.times.join() &&
        c.productName === conflict.productName
      )
    )

    console.log('Final unique conflicts:', uniqueConflicts)

    // If there are conflicting bookings, return false
    if (uniqueConflicts.length > 0) {
      return NextResponse.json({ 
        available: false, 
        conflictingBookings: uniqueConflicts
      })
    }

    return NextResponse.json({ available: true })
  } catch (error) {
    console.error('Error in check-booking-availability:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}