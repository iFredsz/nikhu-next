import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { CartItemsStore } from '@/store/cart-store'
import { ProductType } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isOrderDetails(urlSplit: string[]) {
  return urlSplit[2] === 'orders' && urlSplit.length === 4
}

export function idrFormatter(num: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
  }).format(num)
}

export function firstLetterUppercase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function firestoreDateFormatter(dateInput: any): string {
  console.log('=== firestoreDateFormatter INPUT ===')
  console.log('Input:', dateInput)
  console.log('Type:', typeof dateInput)
  
  if (!dateInput) {
    console.log('No date input')
    return 'No date'
  }
  
  let date: Date;

  try {
    // Handle Firestore serverTimestamp object
    if (dateInput && typeof dateInput === 'object' && dateInput._methodName === 'serverTimestamp') {
      console.log('Detected serverTimestamp')
      return 'Processing...'
    }
    
    // Handle Firestore Timestamp object ({ seconds, nanoseconds })
    if (dateInput && typeof dateInput === 'object' && 'seconds' in dateInput && 'nanoseconds' in dateInput) {
      console.log('Detected Firestore Timestamp')
      date = new Date(dateInput.seconds * 1000);
    }
    // Handle JavaScript Date object
    else if (dateInput instanceof Date) {
      console.log('Detected Date object')
      date = dateInput;
    }
    // Handle string dates (ISO format)
    else if (typeof dateInput === 'string') {
      console.log('Detected string date')
      date = new Date(dateInput);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.log('Invalid string date')
        return 'Invalid date';
      }
    }
    // Handle numeric timestamp
    else if (typeof dateInput === 'number') {
      console.log('Detected numeric timestamp')
      date = new Date(dateInput);
    }
    // Handle other object types (like Firestore Timestamp with toDate method)
    else if (dateInput && typeof dateInput.toDate === 'function') {
      console.log('Detected Firestore Timestamp with toDate method')
      date = dateInput.toDate();
    }
    else {
      console.log('Unknown date format')
      return 'Invalid date';
    }

    // Final validation
    if (!date || isNaN(date.getTime())) {
      console.log('Invalid date after processing')
      return 'Invalid date';
    }

    const formattedDate = `${date.getDate()} ${getMonthName(date.getMonth())} ${date.getFullYear()}, ${formatTime(date.getHours())}:${formatTime(date.getMinutes())}`;
    
    console.log('Formatted date:', formattedDate)
    return formattedDate;

  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Invalid date'
  }

  function getMonthName(monthIndex: number): string {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[monthIndex];
  }

  function formatTime(time: number): string {
    return time < 10 ? `0${time}` : `${time}`;
  }
}

export function extractProductsId(cartItemsStore: CartItemsStore[]) {
  const productId: string[] = []

  cartItemsStore.forEach((item) => {
    productId.push(item.id)
  })

  return productId
}

export function countTotalQuantity(cartItemsStore: CartItemsStore[]) {
  let totalQuantity = 0
  cartItemsStore.forEach((item) => {
    totalQuantity += item.quantity
  })

  return totalQuantity
}

export function countTotalPrice(cartItemsStore: CartItemsStore[], products: ProductType[]) {
  let totalPrice = 0
  for (let i = 0; i < cartItemsStore.length; i++) {
    totalPrice += products[i].price * cartItemsStore[i].quantity
  }

  return totalPrice
}