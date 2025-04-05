'use client'

import {
  createChatSession,
  deleteChatSession,
  getUserSessions,
} from '@/lib/message-storage'
import type { ChatSession } from '@/lib/types'
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface ChatHistoryProps {
  userId: string
  currentSessionId: string
  onCloseSidebar: () => void
}

export function ChatHistory({
  userId,
  currentSessionId,
  onCloseSidebar,
}: ChatHistoryProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const router = useRouter()

  useEffect(() => {
    if (userId) {
      const userSessions = getUserSessions(userId)
      setSessions(userSessions)
    }
  }, [userId, currentSessionId])

  const handleNewChat = () => {
    if (!userId) return

    const newSession = createChatSession(userId)
    router.push(`/?session=${newSession.id}`)
    onCloseSidebar()
  }

  const handleSelectChat = (sessionId: string) => {
    router.push(`/?session=${sessionId}`)
    // onCloseSidebar()
  }

  const handleDeleteChat = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    if (!userId) return

    deleteChatSession(userId, sessionId)

    // Refresh sessions list
    setSessions(getUserSessions(userId))

    // If we deleted the current session, create a new one
    if (sessionId === currentSessionId) {
      const newSession = createChatSession(userId)
      router.push(`/?session=${newSession.id}`)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-neutral-200 border-b px-4 py-2 dark:border-neutral-800">
        <h2 className="font-semibold font-serif">Chat History</h2>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            onClick={handleNewChat}
            aria-label="New Chat"
          >
            <PlusIcon className="size-4" />
          </button>
          <button
            type="button"
            className="rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            onClick={onCloseSidebar}
            aria-label="Close Sidebar"
          >
            <ArrowLeftIcon className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {sessions.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-center text-neutral-500 text-sm">
              No chat history
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {sessions.map((session, index) => (
              <li
                key={session.id}
                className={`cursor-pointer rounded-md px-3 py-2 text-sm transition-colors ${
                  session.id === currentSessionId
                    ? 'bg-neutral-200/50 dark:bg-neutral-700'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }
                `}
                onClick={() => handleSelectChat(session.id)}
              >
                <div className="flex items-center justify-between">
                  <span className="line-clamp-1 font-serif">{session.title}</span>
                  <button
                    disabled={index === 0}
                    type="button"
                    className="group rounded p-1 transition-opacity hover:bg-red-100 disabled:opacity-0 dark:hover:bg-red-700"
                    onClick={(e) => handleDeleteChat(e, session.id)}
                    aria-label="Delete chat"
                  >
                    <TrashIcon className="h-4 w-4 text-neutral-500 group-hover:text-red-600" />
                  </button>
                </div>
                <div className="text-neutral-500 text-xs">
                  {new Date(session.updatedAt).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
