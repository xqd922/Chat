import { ClerkProvider } from '@clerk/nextjs'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import type { Metadata, Viewport } from 'next'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { Toaster } from 'sonner'

import './globals.css'
import { MotionProvider } from '@/components/motion-provider'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: `Hamster's AI SDK`,
  description:
    'This is a preview of using reasoning models with Next.js and the AI SDK.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${GeistSans.variable} ${GeistMono.variable} bg-white/80 dark:bg-black/80`}
      >
        <body>
          <MotionProvider>
            <Toaster position="top-center" />
            <NuqsAdapter>{children}</NuqsAdapter>
          </MotionProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
