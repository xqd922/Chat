import { Chat } from '@/components/chat'
import { Suspense } from 'react'

export default function Home() {
  return (
    <div className="flex size-full flex-col items-center bg-neutral-100 dark:bg-neutral-800/70">
      <Suspense>
        <Chat />
      </Suspense>
    </div>
  )
}
