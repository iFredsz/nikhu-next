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

// Fungsi untuk transform data dari Firestore ke format yang diharapkan ReceiptTemplate
const transformOrderData = (orderData: any) => {
  // Jika sudah ada bookingDetails, return as is
  if (orderData.bookingDetails) {
    return orderData
  }

  // Transform dari struktur Firestore ke struktur yang diharapkan ReceiptTemplate
  const transformed = {
    ...orderData,
    // Map field names
    customerName: orderData.customer_name,
    customerWa: orderData.customer_wa,
    
    // Handle date field - gunakan updated_at dari Firestore jika date tidak ada
    date: orderData.date || orderData.updated_at,
    
    // Convert original_cart_items to bookingDetails
    bookingDetails: orderData.original_cart_items?.map((item: any) => ({
      ...item,
      // Map item fields jika diperlukan
      customerName: item.customerName || orderData.customer_name,
      customerWa: item.customerWa || orderData.customer_wa,
      // Pastikan addons ada
      addons: item.addons || [],
      // Pastikan times ada  
      times: item.times || [],
      // Pastikan people ada
      people: item.people || 1,
      // Total calculation
      total: item.total || item.price * (item.quantity || 1) * (item.people || 1)
    })) || [],
    
    // Fallback ke items jika original_cart_items tidak ada
    items: orderData.midtrans_items || []
  }

  return transformed
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
      console.log('Original order data:', orderData)
      
      // Transform data sebelum dikirim ke ReceiptTemplate
      const transformedData = transformOrderData(orderData)
      console.log('Transformed data:', transformedData)
      console.log('Date field:', transformedData.date) // Debug date field
      
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

  // Transform data untuk preview
  const transformedData = transformOrderData(orderData)

  return (
    <>
      <Button 
        onClick={downloadPDF}
        className="bg-green-600 hover:bg-green-700 text-white"
        disabled={orderData.payment_status !== 'success' || isGenerating}
        size="sm"
      >
        <Download className="mr-2 h-4 w-4" />
        {isGenerating ? 'Membuat PDF...' : 'Download Receipt'}
      </Button>

      {/* Hidden receipt template for PDF generation */}
      <div style={{ 
        position: 'fixed', 
        left: '-10000px', 
        top: 0,
        zIndex: -1000 
      }}>
        <div ref={receiptRef}>
          <ReceiptTemplate 
            orderData={transformedData} 
            orderId={orderId} 
          />
        </div>
      </div>
    </>
  )
}