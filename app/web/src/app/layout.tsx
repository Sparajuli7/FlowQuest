import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'FlowQuest - Video as a Primitive',
  description: 'A user plays a video preview, tweaks checkpoints, and exports a Proof Pack',
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#0B0F14',
  robots: 'index, follow',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'FlowQuest',
    description: 'Video as a Primitive - Interactive video content platform',
    url: 'https://flowquest.dev',
    siteName: 'FlowQuest',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FlowQuest - Video as a Primitive',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FlowQuest',
    description: 'Video as a Primitive - Interactive video content platform',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="color-scheme" content="dark" />
      </head>
      <body className={cn(
        inter.variable,
        "min-h-screen bg-bg text-foreground font-sans antialiased"
      )}>
        <div className="relative min-h-screen">
          {/* Aurora background is handled by CSS */}
          <main className="relative z-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
