'use client'

import { Chat } from '@/components/chat'
import { Loader } from '@/components/loader'
import { createChatSession } from '@/lib/message-storage'
import { ClerkLoaded, ClerkLoading, useUser } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'

function Session() {
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

  return null
}

export default function Home() {
  return (
    <div className="flex size-full flex-col items-center">
      <Suspense>
        <ClerkLoading>
          <div className="flex size-full h-dvh flex-col items-center justify-center">
            <Loader visible={true} />
          </div>
        </ClerkLoading>
        <ClerkLoaded>
          <Session />
          <Chat />
        </ClerkLoaded>
      </Suspense>
    </div>
  )
}
