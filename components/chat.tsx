'use client'

import {
  createChatSession,
  getChatSession,
  getUserSessions,
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
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ChatHistory } from './chat-history'
import { Loader } from './loader'
import UserControl from './user-control'
import UserMessages from './user-messages'

export function Chat() {
  const { user, isSignedIn, isLoaded } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [initialRedirectDone, setInitialRedirectDone] = useState(false)
  const [restoredSessionContent, setRestoredSessionContent] = useState(false)

  // Add a ref to the sidebar
  const sidebarRef = useRef<HTMLDivElement>(null)

  const { messages, setMessages } = useChat({
    id: sessionId || 'primary',
  })

  // Close sidebar when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setSidebarOpen(false)
      }
    }

    // Only add the event listener if the sidebar is open
    if (sidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [sidebarOpen])

  // Log current chat session
  useEffect(() => {
    console.log(`Active chat session: ${sessionId || 'primary'}`)
  }, [sessionId])

  // Only handle session redirection once
  useEffect(() => {
    if (initialRedirectDone) return

    const handleInitialSession = async () => {
      // Only proceed if all conditions are met
      if (!isLoaded || !isSignedIn || !user) return

      console.log('Checking for existing sessions...')
      const userSessions = await getUserSessions(user.id)

      // Only redirect if we don't have a session ID in the URL
      if (!sessionId) {
        if (userSessions.length > 0) {
          // Sort sessions by createdAt in descending order (newest first)
          const sortedSessions = [...userSessions].sort(
            (a, b) =>
              new Date(b.createdat).getTime() - new Date(a.createdat).getTime()
          )

          console.log(
            `Found ${userSessions.length} sessions. Redirecting to most recent: ${sortedSessions[0].id}`
          )
          setInitialRedirectDone(true)
          router.replace(`/?session=${sortedSessions[0].id}`)
        } else {
          console.log('No existing sessions found, creating new session')
          const newSession = await createChatSession(user.id)
          setInitialRedirectDone(true)
          router.replace(`/?session=${newSession.id}`)
        }
      } else {
        setInitialRedirectDone(true)
      }
    }

    if (isLoaded) {
      handleInitialSession()
    }
  }, [isLoaded, isSignedIn, user, sessionId, router, initialRedirectDone])

  // Load session messages when user or sessionId changes
  useEffect(() => {
    const loadSession = async () => {
      if (isSignedIn && user && sessionId) {
        const session = await getChatSession(user.id, sessionId)
        if (session) {
          console.log(`Loading messages for session ${sessionId}`)
          setMessages(session.messages)
          if (!restoredSessionContent) {
            setRestoredSessionContent(true)
          }
        }
      }
    }

    loadSession()
  }, [isSignedIn, user, sessionId, setMessages, restoredSessionContent])

  if (!restoredSessionContent && user) {
    return (
      <div className="flex h-dvh w-full flex-col items-center justify-center">
        <Loader visible={true} />
      </div>
    )
  }

  return (
    <div className="flex h-dvh w-full">
      {/* Overlay for both mobile and desktop when sidebar is open */}
      <div
        className={cn(
          'fixed inset-0 z-30 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ease-in-out',
          isSignedIn && sidebarOpen
            ? 'opacity-100'
            : 'pointer-events-none opacity-0'
        )}
        aria-hidden={!sidebarOpen}
      />

      {isSignedIn && (
        <div
          ref={sidebarRef}
          className={cn(
            'fixed top-0 bottom-0 left-0 z-40 flex w-64 flex-col bg-transparent p-2 transition-transform delay-100 duration-300 ease-in-out',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <ChatHistory
            userId={user?.id || ''}
            currentSessionId={sessionId || ''}
            onCloseSidebar={() => setSidebarOpen(false)}
            restoredSessionContent={restoredSessionContent}
            openState={sidebarOpen}
          />
        </div>
      )}

      <div className="flex flex-1 flex-col items-center">
        <header className="fixed top-0 right-0 z-10 flex w-full items-center justify-between p-4">
          {isSignedIn && (
            <button
              type="button"
              className="rounded-md bg-neutral-50 p-2 text-neutral-500 backdrop-blur-sm transition-colors hover:bg-neutral-100 dark:bg-neutral-800/80 dark:hover:bg-neutral-700"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 18H21M3 12H21M3 6H21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
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
            'flex h-full w-full max-w-3xl flex-col items-center px-4 pb-4',
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
