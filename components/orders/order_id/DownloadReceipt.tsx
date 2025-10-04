'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import ReceiptTemplate from './ReceiptTemplate'

type Props = {
  orderData: any
  orderId: string
}

export default function DownloadReceipt({ orderData, orderId }: Props) {
  const receiptRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const downloadPDF = async () => {
    if (!receiptRef.current) {
      console.error('Receipt ref not found')
      return
    }

    setIsGenerating(true)
    
    try {
      console.log('Starting PDF generation...')
      
      // Capture the receipt element
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })

      console.log('Canvas created, converting to PDF...')
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      
      // Calculate dimensions to fit A4
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = imgWidth / imgHeight
      
      let width = pdfWidth - 20 // Margin
      let height = width / ratio
      
      // If height is more than page height, adjust
      if (height > pdfHeight - 20) {
        height = pdfHeight - 20
        width = height * ratio
      }

      const x = (pdfWidth - width) / 2
      const y = (pdfHeight - height) / 2

      pdf.addImage(imgData, 'PNG', x, y, width, height)
      pdf.save(`Receipt-${orderId}.pdf`)
      
      console.log('PDF downloaded successfully!')
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Gagal mengunduh receipt. Silakan coba lagi.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      <Button 
        onClick={downloadPDF}
        className="bg-green-600 hover:bg-green-700 text-white"
        disabled={orderData.payment_status !== 'success' || isGenerating}
      >
        <Download className="mr-2 h-4 w-4" />
        {isGenerating ? 'Membuat PDF...' : 'Download Receipt PDF'}
      </Button>

      {/* Hidden receipt template for PDF generation */}
      <div style={{ 
        position: 'fixed', 
        left: '-10000px', 
        top: 0,
        zIndex: -1000 
      }}>
        <div ref={receiptRef}>
          <ReceiptTemplate orderData={orderData} orderId={orderId} />
        </div>
      </div>
    </>
  )
}