'use client'

import {
  createChatSession,
  deleteChatSession,
  getUserSessions,
} from '@/lib/message-storage'
import { supabase } from '@/lib/supabase-client'
import type { ChatSession } from '@/lib/types'
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { AnimatePresence, m as motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Loader } from './loader'

interface ChatHistoryProps {
  userId: string
  currentSessionId: string
  onCloseSidebar: () => void
  onHoverPrefetch: (sessionId: string) => Promise<void>
  onSessionSwitch: (sessionId: string) => Promise<void>
  isMobile?: boolean
}

export function ChatHistory({
  userId,
  currentSessionId,
  onCloseSidebar,
  onHoverPrefetch,
  onSessionSwitch,
  isMobile = false,
}: ChatHistoryProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [isDeleting, setIsDeleting] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const fetchSessions = async () => {
    if (userId) {
      try {
        const userSessions = await getUserSessions(userId)
        // Sort sessions by createdAt in descending order (newest first)
        const sortedSessions = [...userSessions].sort(
          (a, b) =>
            new Date(b.createdat).getTime() - new Date(a.createdat).getTime()
        )
        setSessions(sortedSessions)
      } finally {
      }
    }
  }

  // Update to refresh sessions whenever userId changes
  useEffect(() => {
    fetchSessions()
  }, [userId])

  // Set up real-time subscription to monitor changes to user's chat sessions
  useEffect(() => {
    if (!userId) return

    console.log('Setting up real-time subscription for chat sessions')

    // Create subscription for all user's chat sessions
    const supaSubscription = supabase
      .channel(`user-sessions-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'chat_sessions',
          filter: `userid=eq.${userId}`,
        },
        async (payload) => {
          console.log('Real-time update for sessions:', payload.eventType)

          switch (payload.eventType) {
            case 'DELETE': {
              // Handle session deletion
              const deletedSessionId = payload.old.id

              setSessions((prevSessions) => {
                const filterSessions = prevSessions.filter(
                  (session) => session.id !== deletedSessionId
                )
                return filterSessions
              })

              if (deletedSessionId === currentSessionId) {
                // If the deleted session is the current one, switch to the first available session
                setSessions((prevSessions) => {
                  const remainingSessions = prevSessions.filter(
                    (session) => session.id !== deletedSessionId
                  )
                  if (remainingSessions.length > 0) {
                    onSessionSwitch(remainingSessions[0].id)
                  } else {
                    onSessionSwitch('')
                  }
                  return prevSessions
                })
              }
              break
            }
            case 'INSERT': {
              // Handle new session creation
              const newSession = payload.new as ChatSession
              setSessions((prevSessions) => {
                const updatedSessions = [...prevSessions, newSession]
                // Sort sessions by createdAt in descending order
                return updatedSessions.sort(
                  (a, b) =>
                    new Date(b.createdat).getTime() -
                    new Date(a.createdat).getTime()
                )
              })
              break
            }
            case 'UPDATE': {
              // Handle session update
              const updatedSession = payload.new as ChatSession
              setSessions((prevSessions) => {
                const updatedSessions = prevSessions.map((session) =>
                  session.id === updatedSession.id ? updatedSession : session
                )
                // Sort sessions by createdAt in descending order
                return updatedSessions.sort(
                  (a, b) =>
                    new Date(b.createdat).getTime() -
                    new Date(a.createdat).getTime()
                )
              })
              break
            }
          }
        }
      )
      .subscribe()

    // Clean up subscription when component unmounts or userId changes
    return () => {
      console.log('Cleaning up Supabase sessions subscription')
      supaSubscription.unsubscribe()
    }
  }, [userId]) // Only depend on userId for subscription

  const handleNewChat = async () => {
    if (!userId) return

    setIsAdding(true)

    // Close sidebar only on mobile
    if (isMobile) {
      onCloseSidebar()
    }

    const newSession = await createChatSession(userId)
    await onSessionSwitch(newSession.id)
    setIsAdding(false)
  }

  const handleDeleteChat = async (
    e: React.MouseEvent,
    sessionId: string,
    index: number
  ) => {
    setIsDeleting(sessionId)
    e.preventDefault()
    e.stopPropagation()
    if (!userId) return

    await deleteChatSession(userId, sessionId)

    // 本地删除session
    const userSessions = sessions.filter((session) => session.id !== sessionId)

    // Sort sessions by createdAt in descending order
    const sortedSessions = [...userSessions].sort(
      (a, b) =>
        new Date(b.createdat).getTime() - new Date(a.createdat).getTime()
    )
    setSessions(sortedSessions)

    // Navigate to the first session if available
    if (
      sortedSessions.length === 1 ||
      index === 0 ||
      sessionId === currentSessionId
    ) {
      if (isMobile) {
        onCloseSidebar()
      }
      await onSessionSwitch(sortedSessions[0].id)
    }

    setIsDeleting('')
  }

  const handleSessionClick = async (e: React.MouseEvent, sessionId: string) => {
    e.preventDefault()

    // Close sidebar only on mobile
    if (isMobile) {
      onCloseSidebar()
    }

    await onSessionSwitch(sessionId)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border-[1px] border-transparent bg-gradient-to-b from-neutral-50 to-neutral-100 md:border-neutral-200 dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-950">
      <div className="flex items-center justify-between border-neutral-200 border-b bg-white px-4 py-3 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-800/30">
        <h2 className="font-medium text-lg text-neutral-800 dark:text-neutral-200">
          Chat History
        </h2>
        <div className="flex gap-0.5">
          <button
            disabled={isAdding}
            type="button"
            className="rounded-full p-1.5 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:hover:bg-transparent dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
            onClick={handleNewChat}
            aria-label="New Chat"
          >
            {isAdding ? (
              <div className="flex size-5 flex-col items-center justify-center">
                <Loader visible={true} />
              </div>
            ) : (
              <PlusIcon className="size-5" />
            )}
          </button>
          {/* {isMobile && ( */}
          <button
            type="button"
            className="rounded-full p-1.5 text-neutral-600 transition-colors hover:bg-neutral-200 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
            onClick={onCloseSidebar}
            aria-label="Close Sidebar"
          >
            <ArrowLeftIcon className="size-5" />
          </button>
          {/* )} */}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <motion.ul
          className="flex flex-col gap-1"
          layout
          layoutRoot
          transition={{
            duration: 0.2,
            ease: 'easeOut',
          }}
        >
          <AnimatePresence initial={false}>
            {sessions.map((session, index) => (
              <motion.li
                onMouseEnter={() => {
                  if (onHoverPrefetch) {
                    onHoverPrefetch(session.id)
                  }
                }}
                key={session.id}
                initial={{ opacity: 0, scale: 0.96, filter: 'blur(4px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.96, filter: 'blur(4px)' }}
                transition={{
                  duration: 0.2,
                  layout: {
                    duration: 0.2,
                    ease: 'easeOut',
                  },
                }}
                layout
                className={`cursor-pointer rounded-lg ${
                  session.id === currentSessionId
                    ? 'bg-white shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-800 dark:ring-neutral-700'
                    : 'hover:bg-white dark:hover:bg-neutral-800/50'
                } transition-[background-color,box-shadow] duration-150 ease-in-out`}
                onClick={(e) => handleSessionClick(e, session.id)}
                style={{
                  zIndex: sessions.length - index,
                  position: 'relative',
                }}
              >
                <div className="flex h-[50px] items-center justify-between px-4">
                  <span className="line-clamp-1 max-w-[75%] font-medium text-neutral-800 dark:text-neutral-200">
                    {session.title}
                  </span>
                  <button
                    disabled={sessions.length <= 1}
                    type="button"
                    className="group rounded-full p-1.5 opacity-70 transition-opacity duration-150 hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-25"
                    onClick={(e) => handleDeleteChat(e, session.id, index)}
                    aria-label="Delete chat"
                  >
                    {isDeleting === session.id ? (
                      <Loader visible={true} />
                    ) : (
                      <TrashIcon className="h-4 w-4 text-neutral-400 transition-colors duration-150 group-hover:text-red-600 dark:text-neutral-500 dark:group-hover:text-red-400" />
                    )}
                  </button>
                </div>
                <div className="px-4 pb-3 text-neutral-500 text-xs dark:text-neutral-400">
                  {new Date(session.createdat).toLocaleString()}
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      </div>
    </div>
  )
}
