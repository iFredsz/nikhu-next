'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { useRef } from 'react'
import { useReactToPrint as _useReactToPrint } from 'react-to-print'
import ReceiptTemplate from './ReceiptTemplate'

type Props = {
  orderData: any
  orderId: string
}

// Wrapper untuk bypass typing react-to-print
const useReactToPrint = (options: any) => _useReactToPrint(options)

export default function DownloadReceipt({ orderData, orderId }: Props) {
  const receiptRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Receipt-${orderId}`,
    pageStyle: `
      @media print {
        @page { margin: 0; size: auto; }
        body { -webkit-print-color-adjust: exact; }
      }
    `,
  })

  return (
    <>
      <Button 
        onClick={handlePrint}
        className="bg-green-600 hover:bg-green-700 text-white"
        disabled={orderData.payment_status !== 'success'}
      >
        <Download className="mr-2 h-4 w-4" />
        Download Receipt
      </Button>

      {/* Hidden receipt template for printing */}
      <div className="hidden">
        <div ref={receiptRef}>
          <ReceiptTemplate orderData={orderData} orderId={orderId} />
        </div>
      </div>
    </>
  )
}
