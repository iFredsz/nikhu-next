'use client'

import { idrFormatter, firestoreDateFormatter } from '@/lib/utils'

type Props = {
  orderData: any
  orderId: string
}

export default function ReceiptTemplate({ orderData, orderId }: Props) {
  const { 
    bookingDetails = [], 
    items = [],
    customerName,
    customerWa,
    date,
    payment_status,
    gross_amount
  } = orderData

  const formattedDate = firestoreDateFormatter(date)
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const grandTotal = bookingDetails.reduce((total: number, booking: any) => {
    const baseProductPrice = booking.price || 0
    const sessionCount = booking.times?.length || 1
    const peopleCount = booking.people || 1
    const productTotal = baseProductPrice * peopleCount * sessionCount

    const addonsTotal = (booking.addons && Array.isArray(booking.addons))
      ? booking.addons.reduce((acc: number, addon: any) => {
          if (addon.type === 'fixed' && (addon.qty as number) > 0) {
            return acc + addon.price * peopleCount * sessionCount
          } else if (addon.type === 'per_item' && addon.selectedSessions) {
            return (
              acc +
              Object.values(addon.selectedSessions).reduce(
                (sessionAcc: number, qty) =>
                  sessionAcc + addon.price * (qty as number),
                0
              )
            )
          }
          return acc
        }, 0)
      : 0

    const subtotal = productTotal + addonsTotal
    return total + (booking.total || subtotal - (booking.voucherDiscount || 0))
  }, 0)

  const displayItems = (bookingDetails && bookingDetails.length > 0) ? bookingDetails : items

  return (
    <div
      className="receipt-print bg-white text-black font-mono text-xs leading-tight"
      style={{
        width: '100%',
        maxWidth: '340px', 
        minWidth: '220px', 
        margin: '0 auto',
        lineHeight: 1.2,
        fontSize: '10px',
        fontFamily: 'monospace, Courier New, Courier',
        boxSizing: 'border-box',
        padding: '4px',
        textAlign: 'center',
        wordBreak: 'break-word',
      }}
    >
      {/* Header */}
      <div style={{ borderBottom: '1px solid black', paddingBottom: '8px', marginBottom: '8px' }}>
        <h1 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '2px' }}>NIKHU STUDIO</h1>
        <p style={{ margin: 0, fontSize: '10px' }}>Professional Photography</p>
        <p style={{ margin: 0, fontSize: '10px' }}>Jl. Contoh No. 123, Jakarta</p>
        <p style={{ margin: 0, fontSize: '10px' }}>Telp: (021) 123-4567</p>
      </div>

      {/* Order Info */}
      <div style={{ borderBottom: '1px solid black', paddingBottom: '8px', marginBottom: '8px', fontWeight: 'bold' }}>
        INVOICE
      </div>
      <div style={{ textAlign: 'left', padding: '0 4px', marginBottom: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Order ID:</span>
          <span>{orderId}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Tanggal:</span>
          <span>{formattedDate}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Status:</span>
          <span>LUNAS</span>
        </div>
      </div>

      {/* Customer Info */}
      {(customerName || customerWa) && (
        <div style={{ borderTop: '1px dashed black', marginTop: '10px', paddingTop: '8px', marginBottom: '8px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>CUSTOMER</div>
          <div style={{ textAlign: 'left', padding: '0 4px' }}>
            {customerName && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Nama:</span>
                <span>{customerName}</span>
              </div>
            )}
            {customerWa && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>No. WA:</span>
                <span>{customerWa}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Booking Details */}
      <div style={{ borderTop: '1px dashed black', marginTop: '10px', paddingTop: '8px', marginBottom: '8px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>DETAIL BOOKING</div>
        {displayItems && displayItems.length > 0 ? displayItems.map((b: any, idx: number) => {
          const baseProductPrice = b.price || 0
          const sessionCount = b.times?.length || 1
          const peopleCount = b.people || 1
          const productTotal = baseProductPrice * peopleCount * sessionCount

          const addonsTotal = (b.addons && Array.isArray(b.addons))
            ? b.addons.reduce((acc: number, addon: any) => {
                if (addon.type === 'fixed' && (addon.qty as number) > 0) {
                  return acc + addon.price * peopleCount * sessionCount
                } else if (addon.type === 'per_item' && addon.selectedSessions) {
                  return acc + Object.values(addon.selectedSessions).reduce((sa: number, qty) => sa + addon.price * (qty as number), 0)
                }
                return acc
              }, 0)
            : 0

          const subtotal = productTotal + addonsTotal
          const finalTotal = b.total || subtotal - (b.voucherDiscount || 0)

          return (
            <div key={idx} style={{ marginBottom: '10px', borderBottom: idx < displayItems.length -1 ? '1px dashed black' : 'none', paddingBottom: '6px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{b.name}</div>

              {/* Info booking */}
              <div style={{ textAlign: 'left', padding: '0 4px', marginBottom: '6px' }}>
                {(b.customerName || b.customerWa) && (
                  <>
                    {b.customerName && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}><span>Customer:</span><span>{b.customerName}</span></div>}
                    {b.customerWa && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>WA:</span><span>{b.customerWa}</span></div>}
                  </>
                )}
                {b.date && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tanggal:</span><span>{b.date}</span></div>}
                {b.times?.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Sesi:</span></div>
                    {b.times.map((time: string, i: number) => (<div key={i} style={{ textAlign: 'right' }}>- {time}</div>))}
                  </div>
                )}
                {b.people && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Jml Orang:</span><span>{b.people} org</span></div>}
              </div>

              {/* Price breakdown */}
              <div style={{ borderTop: '1px dashed black', marginTop: '8px', paddingTop: '6px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>RINCIAN</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px' }}>
                  <span>{b.name}:</span>
                  <span>{idrFormatter(productTotal)}</span>
                </div>
                <div style={{ fontSize: '9px', textAlign: 'right', padding: '0 4px' }}>
                  ({idrFormatter(baseProductPrice)} × {peopleCount} × {sessionCount})
                </div>

                {b.addons && Array.isArray(b.addons) && b.addons.map((addon: any, i: number) => {
                  if (addon.type === 'fixed' && (addon.qty as number) > 0) {
                    const addonSubtotal = addon.price * peopleCount * sessionCount
                    return (
                      <div key={i} style={{ padding: '0 4px', marginBottom: '2px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{addon.name}:</span>
                          <span>{idrFormatter(addonSubtotal)}</span>
                        </div>
                        <div style={{ fontSize: '9px', textAlign: 'right' }}>
                          ({idrFormatter(addon.price)} × {peopleCount} × {sessionCount})
                        </div>
                      </div>
                    )
                  } else if (addon.type === 'per_item' && addon.selectedSessions) {
                    return Object.entries(addon.selectedSessions).filter(([_, qty]) => (qty as number) > 0).map(([session, qty]) => (
                      <div key={session} style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px', marginBottom: '2px' }}>
                        <span>{addon.name}({session}):</span>
                        <span>{idrFormatter(addon.price * (qty as number))}</span>
                      </div>
                    ))
                  }
                  return null
                })}

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px', borderTop: '1px dashed black', marginTop: '8px', paddingTop: '8px' }}>
                  <span>Subtotal:</span>
                  <span>{idrFormatter(subtotal)}</span>
                </div>
                {b.voucherDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px', marginTop: '2px' }}>
                    <span>Diskon:</span>
                    <span>-{idrFormatter(b.voucherDiscount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid black', padding: '4px', marginTop: '8px' }}>
                  <span>TOTAL:</span>
                  <span>{idrFormatter(finalTotal)}</span>
                </div>
              </div>
            </div>
          )
        }) : <div>No items</div>}
      </div>

      {/* Grand Total */}
      <div style={{ borderTop: '1px solid black', marginTop: '10px', paddingTop: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', padding: '0 4px' }}>
        <span>TOTAL DIBAYAR:</span>
        <span>{idrFormatter(grandTotal)}</span>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px dashed black', marginTop: '10px', paddingTop: '8px', textAlign: 'center' }}>
        <p style={{ fontWeight: 'bold', margin: '2px 0' }}>TERIMA KASIH</p>
        <p style={{ fontSize: '10px', margin: '2px 0' }}>Tunjukkan receipt ini saat ke studio</p>
        <p style={{ fontSize: '10px', margin: '2px 0' }}>Printed: {currentDate}</p>
      </div>

      {/* Spacer untuk mesin thermal */}
      <div style={{ height: '20px' }}></div>

      {/* Print media query */}
      <style>
        {`@media print {
          .receipt-print {
            width: 100% !important;
            margin: 0 auto !important;
            padding: 4px !important;
          }
        }`}
      </style>
    </div>
  )
}
