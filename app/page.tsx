'use client'

import { Chat } from '@/components/chat'
import { createChatSession } from '@/lib/message-storage'
import { useUser } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'

export default function Home() {
  const { user, isSignedIn, isLoaded } = useUser()
  const searchParams = useSearchParams()
  const sessionParam = searchParams.get('session')
  const router = useRouter()

  // Handle the 'new' session parameter
  useEffect(() => {
    if (isLoaded && isSignedIn && user && sessionParam === 'new') {
      const newSession = createChatSession(user.id)
      router.replace(`/?session=${newSession.id}`)
    }
  }, [isLoaded, isSignedIn, user, sessionParam, router])

  return (
    <div className="flex size-full flex-col items-center">
      <Suspense>
        <Chat />
      </Suspense>
    </div>
  )
}
