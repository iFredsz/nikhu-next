'use client'

import { idrFormatter } from '@/lib/utils'

type Props = {
  orderData: any
  orderId: string
}

export default function ReceiptTemplate({ orderData, orderId }: Props) {
  const { 
    bookingDetails, 
    customerName,
    customerWa 
  } = orderData

  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div className="p-6 max-w-md mx-auto bg-white text-gray-800 font-sans">
      {/* Header */}
      <div className="text-center border-b border-gray-300 pb-4 mb-4">
        <h1 className="text-2xl font-bold text-gray-900">NIKHU STUDIO</h1>
        <p className="text-sm text-gray-600">Professional Photography Studio</p>
        <p className="text-xs text-gray-500 mt-1">Jl. Contoh No. 123, Jakarta</p>
        <p className="text-xs text-gray-500">Telp: (021) 123-4567</p>
      </div>

      {/* Order Info */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-semibold">Order ID:</span>
          <span>{orderId}</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="font-semibold">Tanggal:</span>
          <span>{currentDate}</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="font-semibold">Status:</span>
          <span className="font-bold text-green-600">PAID</span>
        </div>
      </div>

      {/* Customer Info */}
      {(customerName || customerWa) && (
        <div className="border-t border-gray-300 pt-3 mb-4">
          <h3 className="font-semibold text-sm mb-2">Customer Info:</h3>
          {customerName && <p className="text-sm">Nama: {customerName}</p>}
          {customerWa && <p className="text-sm">WhatsApp: {customerWa}</p>}
        </div>
      )}

      {/* Booking Details */}
      <div className="border-t border-gray-300 pt-3 mb-4">
        <h3 className="font-semibold text-sm mb-3">Booking Details:</h3>
        
        {bookingDetails?.map((booking: any, index: number) => (
          <div key={index} className="mb-4 last:mb-0">
            <div className="font-semibold text-gray-900 mb-2">{booking.name}</div>

            {/* Booking Info */}
            <div className="text-sm space-y-1 mb-3">
              {booking.date && (
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span>{booking.date}</span>
                </div>
              )}
              
              {booking.times?.length > 0 && (
                <div>
                  <span>Sesi:</span>
                  <div className="text-right">
                    {booking.times.map((time: string, idx: number) => (
                      <div key={idx}>{time}</div>
                    ))}
                  </div>
                </div>
              )}

              {booking.people && (
                <div className="flex justify-between">
                  <span>Jumlah Orang:</span>
                  <span>{booking.people} orang</span>
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="text-sm border-t border-gray-200 pt-2">
              {/* Base Price */}
              <div className="flex justify-between mb-1">
                <span>Harga Paket</span>
                <span>{idrFormatter(booking.total - (booking.voucherDiscount || 0))}</span>
              </div>

              {/* Addons */}
              {booking.addons?.map((addon: any, addonIndex: number) => {
                if (addon.type === 'fixed' && addon.qty > 0) {
                  const addonTotal = addon.price * (booking.people || 1) * (booking.times?.length || 1)
                  return (
                    <div key={addonIndex} className="flex justify-between mb-1">
                      <span>{addon.name}</span>
                      <span>+{idrFormatter(addonTotal)}</span>
                    </div>
                  )
                } else if (addon.type === 'per_item' && addon.selectedSessions) {
                  return Object.entries(addon.selectedSessions)
                    .filter(([_, qty]) => (qty as number) > 0)
                    .map(([session, qty]) => (
                      <div key={session} className="flex justify-between mb-1">
                        <span>{addon.name} ({session})</span>
                        <span>+{idrFormatter(addon.price * (qty as number))}</span>
                      </div>
                    ))
                }
                return null
              })}

              {/* Voucher Discount */}
              {booking.voucherDiscount > 0 && (
                <div className="flex justify-between mb-1 text-green-600">
                  <span>Diskon Voucher</span>
                  <span>-{idrFormatter(booking.voucherDiscount)}</span>
                </div>
              )}

              {/* Total */}
              <div className="flex justify-between font-semibold border-t border-gray-300 pt-2 mt-2">
                <span>TOTAL</span>
                <span>{idrFormatter(booking.total)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Grand Total */}
      {bookingDetails?.length > 1 && (
        <div className="border-t border-gray-300 pt-3">
          <div className="flex justify-between text-lg font-bold">
            <span>GRAND TOTAL</span>
            <span>
              {idrFormatter(
                bookingDetails.reduce((sum: number, booking: any) => sum + booking.total, 0)
              )}
            </span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-300 pt-4 mt-6 text-center">
        <p className="text-xs text-gray-500 mb-2">Terima kasih atas kepercayaan Anda</p>
        <p className="text-xs text-gray-500">
          Silakan tunjukkan receipt ini saat datang ke studio
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Receipt ini sah dan dapat digunakan sebagai bukti pembayaran
        </p>
      </div>
    </div>
  )
}
