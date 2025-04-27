import { ClerkProvider } from '@clerk/nextjs'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from 'next-themes'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { Toaster } from 'sonner'

import './globals.css'
import { ThemeColorManager } from '@/components/ThemeColorManager'
import { MotionProvider } from '@/components/motion-provider'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  manifest: '/manifest.json',
  title: `Hamster's AI SDK`,
  description:
    'This is a preview of using reasoning models with Next.js and the AI SDK.',
  appleWebApp: {
    capable: true,
    title: 'Chatde',
    statusBarStyle: 'default',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html
        suppressHydrationWarning
        lang="en"
        className={`${GeistSans.variable} ${GeistMono.variable}`}
      >
        <body>
          <ThemeProvider>
            <MotionProvider>
              <Toaster position="top-center" />
              <NuqsAdapter>
                <ThemeColorManager />
                {children}
              </NuqsAdapter>
            </MotionProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
