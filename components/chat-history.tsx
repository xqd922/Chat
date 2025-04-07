'use client'

import {
  createChatSession,
  deleteChatSession,
  getUserSessions,
} from '@/lib/message-storage'
import type { ChatSession } from '@/lib/types'
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface ChatHistoryProps {
  userId: string
  currentSessionId: string
  onCloseSidebar: () => void
  restoredSessionContent: boolean
  openState: boolean
  onSessionSwitch: (sessionId: string) => Promise<void>
  onSessionHover: (sessionId: string) => Promise<void>
}

export function ChatHistory({
  userId,
  currentSessionId,
  onCloseSidebar,
  restoredSessionContent,
  openState,
  onSessionSwitch,
  onSessionHover,
}: ChatHistoryProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const _router = useRouter()

  const fetchSessions = async () => {
    if (userId) {
      const userSessions = await getUserSessions(userId)
      // Sort sessions by createdAt in descending order (newest first)
      const sortedSessions = [...userSessions].sort(
        (a, b) =>
          new Date(b.createdat).getTime() - new Date(a.createdat).getTime()
      )
      setSessions(sortedSessions)
    }
  }

  // Update to refresh sessions whenever userId or currentSessionId changes
  useEffect(() => {
    if (openState) {
      fetchSessions()
    }
  }, [userId, currentSessionId, openState])

  const handleNewChat = async () => {
    if (!userId) return

    const newSession = await createChatSession(userId)
    await onSessionSwitch(newSession.id)
    onCloseSidebar()
  }

  const handleDeleteChat = async (e: React.MouseEvent, sessionId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!userId) return

    await deleteChatSession(userId, sessionId)

    // Refresh sessions list
    const userSessions = await getUserSessions(userId)
    // Sort sessions by createdAt in descending order
    const sortedSessions = [...userSessions].sort(
      (a, b) =>
        new Date(b.createdat).getTime() - new Date(a.createdat).getTime()
    )
    setSessions(sortedSessions)

    // Navigate to the first session if available
    if (sortedSessions.length > 0) {
      await onSessionSwitch(sortedSessions[0].id)
    }
  }

  const handleSessionClick = async (e: React.MouseEvent, sessionId: string) => {
    e.preventDefault()
    await onSessionSwitch(sessionId)
    onCloseSidebar()
  }

  if (!restoredSessionContent || sessions.length === 0) {
    return <div className="flex h-full items-center justify-center" />
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border-[1px] border-transparent bg-gradient-to-b from-neutral-50 to-neutral-100 dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-950">
      <div className="flex items-center justify-between border-neutral-200 border-b bg-white/80 px-4 py-3 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/80">
        <h2 className="font-medium font-serif text-lg text-neutral-800 dark:text-neutral-200">
          Chat History
        </h2>
        <div className="flex gap-0.5">
          <button
            type="button"
            className="rounded-full p-1.5 text-neutral-600 transition-colors hover:bg-neutral-200 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
            onClick={handleNewChat}
            aria-label="New Chat"
          >
            <PlusIcon className="size-5" />
          </button>
          <button
            type="button"
            className="rounded-full p-1.5 text-neutral-600 transition-colors hover:bg-neutral-200 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
            onClick={onCloseSidebar}
            aria-label="Close Sidebar"
          >
            <ArrowLeftIcon className="size-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {sessions.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
            <div className="rounded-full bg-neutral-200 p-3 dark:bg-neutral-700">
              <PlusIcon className="size-6 text-neutral-500 dark:text-neutral-300" />
            </div>
            <p className="text-center text-neutral-500 dark:text-neutral-400">
              No chat history yet
            </p>
            <button
              type="button"
              onClick={handleNewChat}
              className="mt-2 rounded-md bg-neutral-200 px-4 py-2 font-medium text-neutral-700 text-sm transition-colors hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
            >
              Start a new chat
            </button>
          </div>
        ) : (
          <ul className="flex flex-col gap-1">
            <AnimatePresence initial={false}>
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onMouseEnter={() => onSessionHover(session.id)}
                >
                  <motion.li
                    initial={{ opacity: 0, height: 0, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, height: 'auto', filter: 'blur(0)' }}
                    exit={{ opacity: 0, height: 'auto', filter: 'blur(4px)' }}
                    transition={{ duration: 0.3 }}
                    layout
                    onClick={(e) => handleSessionClick(e, session.id)}
                    className={`cursor-pointer rounded-lg ${
                      session.id === currentSessionId
                        ? 'bg-white shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-800 dark:ring-neutral-700'
                        : 'hover:bg-white dark:hover:bg-neutral-800/50'
                    } transition-[background-color,box-shadow] duration-150 ease-in-out `}
                  >
                    <div className="flex h-[50px] items-center justify-between px-4">
                      <span className="line-clamp-1 max-w-[75%] font-medium font-serif text-neutral-800 dark:text-neutral-200">
                        {session.title}
                      </span>
                      <button
                        disabled={sessions.length <= 1}
                        type="button"
                        className="group rounded-full p-1.5 opacity-70 transition-opacity duration-150 hover:opacity-100 disabled:opacity-0"
                        onClick={(e) => handleDeleteChat(e, session.id)}
                        aria-label="Delete chat"
                      >
                        <TrashIcon className="h-4 w-4 text-neutral-400 transition-colors duration-150 group-hover:text-red-600 dark:text-neutral-500 dark:group-hover:text-red-400" />
                      </button>
                    </div>
                    <div className="px-4 pb-3 text-neutral-500 text-xs dark:text-neutral-400">
                      {new Date(session.createdat).toLocaleString()}
                    </div>
                  </motion.li>
                </div>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  )
}
