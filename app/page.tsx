'use client'

import { Chat } from '@/components/chat'
import { Suspense } from 'react'

export default function Home() {
  return (
    <div className="flex size-full flex-col items-center">
      <Suspense>
        <Chat />
      </Suspense>
    </div>
  )
}
