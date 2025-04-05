'use client'

import {
  createChatSession,
  getChatSession,
  saveMessages,
} from '@/lib/message-storage'
import { cn } from '@/lib/utils'
import { useChat } from '@ai-sdk/react'
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from '@clerk/nextjs'
import { Bars3Icon } from '@heroicons/react/24/outline'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ChatHistory } from './chat-history'
import UserControl from './user-control'
import UserMessages from './user-messages'

export function Chat() {
  const { isSignedIn, user, isLoaded } = useUser()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')

  // Use a consistent chat ID across components
  const chatId = sessionId || 'primary'

  // Initialize messages separately for the active chat
  const { messages, setMessages } = useChat({
    id: chatId,
  })

  // Log current chat session
  useEffect(() => {
    console.log(`Active chat session: ${chatId}`)
  }, [chatId])

  const router = useRouter()

  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Load session messages when user or sessionId changes
  useEffect(() => {
    if (isSignedIn && user && sessionId) {
      const session = getChatSession(user.id, sessionId)
      if (session) {
        setMessages(session.messages)
      }
    }
  }, [isSignedIn, user, sessionId, setMessages])

  // Save messages when they change
  useEffect(() => {
    if (isSignedIn && user && sessionId && messages.length > 0) {
      saveMessages(user.id, sessionId, messages)
    }
  }, [messages, isSignedIn, user, sessionId])

  // Create a new session when user signs in without a session
  useEffect(() => {
    if (isLoaded && isSignedIn && user && !sessionId) {
      const newSession = createChatSession(user.id)
      router.push(`/?session=${newSession.id}`)
    }
  }, [isLoaded, isSignedIn, user, sessionId, router])

  return (
    <div className="flex h-dvh w-full">
      {isSignedIn && (
        <div
          className={cn(
            'fixed top-0 bottom-0 left-0 z-40 flex w-64 flex-col border-neutral-200 border-r bg-neutral-50 transition-transform dark:border-neutral-800 dark:bg-neutral-900',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            // 'md:relative md:translate-x-0'
          )}
        >
          <ChatHistory
            userId={user?.id || ''}
            currentSessionId={sessionId || ''}
            onCloseSidebar={() => setSidebarOpen(false)}
          />
        </div>
      )}

      <div className="flex flex-1 flex-col items-center">
        <header className="fixed top-0 right-0 z-10 flex w-full items-center justify-between p-4">
          {isSignedIn && (
            <button
              type="button"
              className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          )}
          <div className="flex-1" />
          <SignedIn>
            <UserButton userProfileMode="modal" />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <div className="cursor-pointer rounded-lg border px-4 py-2 font-medium text-sm shadow-sm transition-colors dark:border-neutral-700">
                Sign in
              </div>
            </SignInButton>
          </SignedOut>
        </header>

        <div
          className={cn(
            'flex h-full w-full max-w-3xl flex-col items-center px-4 pt-8 pb-4 md:px-0',
            {
              'justify-between': messages.length > 0,
              'justify-center gap-4': messages.length === 0,
            }
          )}
        >
          <UserMessages />
          <UserControl />
        </div>
      </div>
    </div>
  )
}
