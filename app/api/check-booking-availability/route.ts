import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { ExtendedCartItems } from '@/components/cart/Cart'

interface ConflictBooking {
  date: string
  times: string[]
  productName?: string
}

interface AvailabilityResponse {
  available: boolean
  conflictingBookings?: ConflictBooking[]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cartItems } = body as { cartItems: ExtendedCartItems[] }

    console.log('=== AVAILABILITY CHECK START ===')
    console.log('Received cart items count:', cartItems?.length || 0)

    if (!cartItems || cartItems.length === 0) {
      console.log('No cart items, returning available')
      return NextResponse.json({ available: true })
    }

    // Validate cart items structure dengan type guard
    const validCartItems = cartItems.filter((item): item is ExtendedCartItems & { date: string; times: string[] } => 
      !!item && 
      typeof item === 'object' && 
      !!item.date && 
      !!item.times &&
      Array.isArray(item.times) &&
      item.times.length > 0
    )

    console.log('Valid cart items count:', validCartItems.length)

    if (validCartItems.length === 0) {
      console.log('No valid cart items, returning available')
      return NextResponse.json({ available: true })
    }

    const conflictingBookings: ConflictBooking[] = []

    // Get all users
    const usersSnapshot = await adminDb.collection('users').get()
    
    console.log(`Found ${usersSnapshot.size} users to check`)

    // Check each cart item against existing orders from all users
    for (const cartItem of validCartItems) {
      console.log(`\nChecking cart item: ${cartItem.name} on ${cartItem.date} at ${cartItem.times.join(', ')}`)

      // Check orders for each user
      for (const userDoc of usersSnapshot.docs) {
        try {
          const ordersSnapshot = await adminDb
            .collection('users')
            .doc(userDoc.id)
            .collection('orders')
            .where('payment_status', '==', 'success')
            .get()

          console.log(`Checking user ${userDoc.id}, found ${ordersSnapshot.size} successful orders`)

          for (const orderDoc of ordersSnapshot.docs) {
            const orderData = orderDoc.data()
            
            // Check if this order has original_cart_items
            if (orderData.original_cart_items && Array.isArray(orderData.original_cart_items)) {
              for (const orderItem of orderData.original_cart_items) {
                // Skip if order item doesn't have required properties
                if (!orderItem || !orderItem.date || !orderItem.times || !Array.isArray(orderItem.times)) {
                  continue
                }

                // Skip if different date
                if (orderItem.date !== cartItem.date) continue

                console.log(`Found order with same date: ${orderItem.date}`)

                // Check for time conflicts
                const orderTimes: string[] = orderItem.times
                const cartTimes: string[] = cartItem.times
                
                const timeConflicts = orderTimes.filter((time: string) => 
                  cartTimes.includes(time)
                )
                
                if (timeConflicts.length > 0) {
                  console.log(`⛔ TIME CONFLICT FOUND: ${timeConflicts.join(', ')}`)
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
        JSON.stringify(c.times.sort()) === JSON.stringify(conflict.times.sort()) &&
        c.productName === conflict.productName
      )
    )

    console.log('Final unique conflicts:', uniqueConflicts)

    // If there are conflicting bookings, return false
    if (uniqueConflicts.length > 0) {
      console.log('=== AVAILABILITY CHECK END: NOT AVAILABLE ===')
      return NextResponse.json({ 
        available: false, 
        conflictingBookings: uniqueConflicts
      })
    }

    console.log('=== AVAILABILITY CHECK END: AVAILABLE ===')
    return NextResponse.json({ available: true })
  } catch (error) {
    console.error('❌ Error in check-booking-availability:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}