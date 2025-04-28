'use client'

import { authClient } from '@/lib/auth-client'
import {
  createChatSession,
  getChatSession,
  getUserSessions,
} from '@/lib/message-storage'
import { UserSession } from '@/lib/nusq'
import { supabase } from '@/lib/supabase-client'
import { cn } from '@/lib/utils'
import { type Message, useChat } from '@ai-sdk/react'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { useEffect, useRef, useState } from 'react'
import { ChatHistory } from './chat-history'
import { Button } from './ui/button'
import UserControl from './user-control'
import UserMessages from './user-messages'

export function Chat() {
  const { data: userSession, isPending: isLoaded } = authClient.useSession()

  const isSignedIn = !isLoaded && userSession !== null

  const [sessionId, setSessionId] = useQueryState<string>(
    UserSession,
    parseAsString
  )
  const [sidebarOpen, setSidebarOpen] = useQueryState<boolean>(
    'sidebarOpen',
    parseAsBoolean
  )

  const [initialRedirectDone, setInitialRedirectDone] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  // Add a cache to store loaded sessions
  const [sessionsCache, setSessionsCache] = useState<Record<string, Message[]>>(
    {}
  )
  const [isLoading, setIsLoading] = useState(false)

  // Add a ref to the sidebar
  const sidebarRef = useRef<HTMLDivElement>(null)

  const { messages, setMessages } = useChat({
    id: sessionId || 'primary',
  })

  // Check if the device is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024) // 1024px breakpoint for lg
    }

    // Initial check
    checkIsMobile()

    // Add resize listener
    window.addEventListener('resize', checkIsMobile)

    // Cleanup
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  // Close sidebar when clicking outside of it on mobile devices
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMobile &&
        sidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setSidebarOpen(false)
      }
    }

    // Only add the event listener if the sidebar is open on mobile
    if (isMobile && sidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [sidebarOpen, isMobile])

  // Log current chat session
  useEffect(() => {
    console.log(`Active chat session: ${sessionId || 'primary'}`)
  }, [sessionId])

  // 处理会话切换
  const handleSessionSwitch = async (newSessionId: string) => {
    if (!userSession || newSessionId === sessionId) return
    setSessionId(newSessionId)
  }

  // Only handle session redirection once
  useEffect(() => {
    if (initialRedirectDone) return

    const handleInitialSession = async () => {
      // Only proceed if all conditions are met
      if (!isLoaded || !isSignedIn || !userSession) return
      // Only redirect if we don't have a session ID in the URL
      if (!sessionId) {
        console.log('Checking for existing sessions...')
        const userSessions = await getUserSessions(userSession.user.id)
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
          setSessionId(sortedSessions[0].id)
        } else {
          console.log('No existing sessions found, creating new session')
          const newSession = await createChatSession(userSession.user.id)
          setInitialRedirectDone(true)
          setSessionId(newSession.id)
        }
      } else {
        setInitialRedirectDone(true)
      }
    }

    if (isLoaded) {
      handleInitialSession()
    }
  }, [
    isLoaded,
    isSignedIn,
    userSession,
    sessionId,
    initialRedirectDone,
    setSessionId,
  ])

  // Load session messages when user or sessionId changes
  useEffect(() => {
    const loadSession = async () => {
      if (isSignedIn && userSession && sessionId) {
        // Check if session is already in cache
        if (sessionsCache[sessionId]) {
          console.log(`Loading messages for session ${sessionId} from cache`)
          setMessages(sessionsCache[sessionId])
        } else {
          setIsLoading(true)
          // 获取会话数据
          const session = await getChatSession(userSession.user.id, sessionId)
          if (session) {
            console.log(`Loading messages for session ${sessionId}`)
            setMessages(session.messages)
            // Update cache
            setSessionsCache((prevCache) => ({
              ...prevCache,
              [sessionId]: session.messages,
            }))
          }
          setIsLoading(false)
        }
      }
    }

    loadSession()
  }, [isSignedIn, userSession, sessionId])

  // Set up real-time subscription to Supabase changes
  useEffect(() => {
    if (!isSignedIn || !userSession || !sessionId) return

    // Create subscription for the current session
    const supaSubscription = supabase
      .channel(`session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_sessions',
          filter: `id=eq.${sessionId}`,
        },
        async (payload) => {
          console.log('Received real-time update for session:', sessionId)
          // Only update if we're not the source of this change
          // This prevents update loops when our own component saves changes
          if (payload.new && payload.new.updatedat !== payload.old.updatedat) {
            // Fetch the latest session data
            setSessionsCache((prevCache) => ({
              ...prevCache,
              [sessionId]: payload.new.messages,
            }))
            // Update messages in the chat
            setMessages(payload.new.messages)
          }
        }
      )
      .subscribe()

    // Clean up subscription when component unmounts or session changes
    return () => {
      console.log('Cleaning up Supabase subscription')
      supaSubscription.unsubscribe()
    }
  }, [isSignedIn, userSession, sessionId, setMessages])

  const handlePrefetch = async (sessionId: string) => {
    if (!userSession) return
    if (sessionsCache[sessionId]) return
    const session = await getChatSession(userSession.user.id, sessionId)
    if (session) {
      // Update cache
      setSessionsCache((prevCache) => ({
        ...prevCache,
        [sessionId]: session.messages,
      }))
    }
  }

  return (
    <div className="flex min-h-dvh w-full">
      {/* Overlay for mobile when sidebar is open */}
      <div
        className={cn(
          'fixed inset-0 z-30 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ease-in-out lg:hidden',
          isSignedIn && sidebarOpen
            ? 'opacity-100'
            : 'pointer-events-none opacity-0'
        )}
        aria-hidden={!sidebarOpen || !isMobile}
      />

      {isSignedIn && (
        <div
          ref={sidebarRef}
          className={cn(
            'fixed top-0 bottom-0 left-0 z-40 flex w-64 flex-col bg-transparent p-2 transition-transform duration-300 ease-in-out',
            // Mobile behavior - slide in and out
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            // Desktop behavior - always visible with content pushed over
            // !isMobile ? 'translate-x-0' : ''
          )}
        >
          <ChatHistory
            userId={userSession?.user.id || ''}
            currentSessionId={sessionId || ''}
            onCloseSidebar={() => setSidebarOpen(false)}
            onSessionSwitch={handleSessionSwitch}
            isMobile={isMobile}
            onHoverPrefetch={handlePrefetch}
          />
        </div>
      )}

      <div
        className={cn(
          'flex flex-1 flex-col items-center transition-all duration-300',
          isSignedIn && sidebarOpen && !isMobile ? 'ml-64' : 'ml-0'
        )}
      >
        <header className="fixed top-0 right-0 z-10 flex w-full items-center justify-between p-4">
          {isSignedIn && (
            <button
              type="button"
              className="rounded-md bg-neutral-50 p-2 text-neutral-500 backdrop-blur-sm transition-colors hover:bg-neutral-100 dark:bg-neutral-800/80 dark:hover:bg-neutral-700"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
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
          {!isSignedIn ? (
            <a href="/login">
              <Button className="rounded-lg" variant={'outline'}>
                Login
              </Button>
            </a>
          ) : (
            <div className="font-serif text-neutral-700 text-sm dark:text-neutral-400">
              Hi, {userSession?.user.name}
            </div>
          )}
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
          <UserMessages messages={messages} isLoading={isLoading} />
          <UserControl sessionId={sessionId || ''} />
        </div>
      </div>
    </div>
  )
}
