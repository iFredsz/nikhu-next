import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import { ThemeProvider } from '@/components/theme-provider'
import Header from '@/components/layout/Header'
import { Separator } from '@/components/ui/separator'
import Footer from '@/components/layout/Footer'
import ProgressbarProvider from '@/components/ProgressbarProvider'
import SessionProvider from '@/components/SessionProvider'
import { Toaster } from 'sonner'
import { getServerSession } from 'next-auth'
import WhatsAppButton from '@/components/global/WhatsappButton' 

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Nikhu Studio – Foto Studio di Salatiga',
  description: 'Nikhu Studio adalah foto studio profesional di Salatiga yang menawarkan sesi foto, prewedding, dan personal branding dengan hasil kreatif dan modern.',
  keywords: ['Nikhu Studio', 'Foto Studio Salatiga', 'Studio Foto Nikhu', 'Prewedding Salatiga', 'Fotografi Salatiga'],
  openGraph: {
    title: 'Nikhu Studio – Foto Studio di Salatiga',
    description: 'More Than Just Pictures. Nikhu Studio menghadirkan pengalaman foto profesional dan hasil yang berkesan.',
    url: 'https://nikhustudio.com',
    siteName: 'Nikhu Studio',
    locale: 'id_ID',
    type: 'website',
    images: [
      {
        url: 'https://nikhustudio.com/nikhulogo.webp',
        width: 1200,
        height: 630,
        alt: 'Nikhu Studio - Foto Studio di Salatiga',
      },
    ],
  },
  alternates: {
    canonical: 'https://nikhustudio.com',
  },
  robots: {
    index: true,
    follow: true,
  },
}


export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()

  return (
    <html lang="en">
      <body className={cn('bg-background font-sans antialiased', inter.variable)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider session={session}>
            <div id="web-wrapper" className="container flex min-h-screen flex-col">
              <Header />
              <Separator className="hidden md:block" />

              <main className="flex-1 pb-20">
                <ProgressbarProvider>{children}</ProgressbarProvider>
              </main>

              <Toaster position="top-center" closeButton />
              <Footer />
            </div>

            
            <WhatsAppButton />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
