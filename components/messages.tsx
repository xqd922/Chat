'use client'

import { UserSession } from '@/lib/nusq'
import { cn } from '@/lib/utils'
import type { UseChatHelpers } from '@ai-sdk/react'
import { ArrowDownIcon } from '@heroicons/react/24/solid'
import type { UIMessage } from 'ai'
import { AnimatePresence, m as motion } from 'framer-motion'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Message } from './message-part/message'
import ShinyText from './shiny-text'

interface MessagesProps {
  messages: Array<UIMessage>
  status: UseChatHelpers['status']
  fetchStatus?: string
}

export function Messages({ messages, status, fetchStatus }: MessagesProps) {
  const messagesRef = useRef<HTMLDivElement>(null)
  const [sessionId] = useQueryState<string>(UserSession, parseAsString)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [sidebarOpen] = useQueryState<boolean>(
    'sidebarOpen',
    parseAsBoolean.withDefault(false)
  )
  const bottomAnchorRef = useRef<HTMLDivElement>(null)

  // Determine latest user-AI message pair
  const latestMessages = useMemo(() => {
    if (messages.length === 0) return []

    // Find the last user message and corresponding AI response
    const lastUserIndex = [...messages]
      .reverse()
      .findIndex((msg) => msg.role === 'user')
    if (lastUserIndex === -1) return messages.slice(-1) // No user messages, just show last message

    const startIndex = messages.length - 1 - lastUserIndex
    return messages.slice(startIndex)
  }, [messages])

  // Historical messages are all messages except the latest pair
  const historicalMessages = useMemo(() => {
    if (messages.length <= latestMessages.length) return []
    return messages.slice(0, messages.length - latestMessages.length)
  }, [messages, latestMessages])

  const scrollToBottomImmediately = () => {
    if (bottomAnchorRef.current) {
      bottomAnchorRef.current.scrollIntoView({ behavior: 'auto' })
    } else {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'auto',
      })
    }
  }

  // Initial render handling
  useEffect(() => {
    scrollToBottomImmediately()
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  // Add window scroll event handler to show/hide scroll button
  useEffect(() => {
    const handleScroll = () => {
      // Calculate distance from bottom of page
      const scrollPosition = window.scrollY + window.innerHeight
      const bottomOfPage = document.body.scrollHeight

      // Show button when scrolled up at least 50px from bottom
      const isScrolledUp = bottomOfPage - scrollPosition > 50
      setShowScrollButton(isScrolledUp)
    }

    window.addEventListener('scroll', handleScroll)

    // Run the scroll handler immediately to set correct initial state
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Use a separate effect to check if we need to show the scroll button when messages change
  useEffect(() => {
    // Check if we're scrolled away from bottom and should show the button
    const scrollPosition = window.scrollY + window.innerHeight
    const bottomOfPage = document.body.scrollHeight
    const isScrolledUp = bottomOfPage - scrollPosition > 50

    if (!showScrollButton && isScrolledUp) {
      setShowScrollButton(isScrolledUp)
    } else if (showScrollButton && !isScrolledUp) {
      setShowScrollButton(false)
    }
  }, [messages, showScrollButton])

  const scrollToBottom = () => {
    if (bottomAnchorRef.current) {
      bottomAnchorRef.current.scrollIntoView({
        behavior: 'smooth' as ScrollBehavior,
      })
    } else {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth' as ScrollBehavior,
      })
    }
  }

  const lastAssistantIndex = useMemo(
    () => messages.findLastIndex((msg) => msg.role === 'assistant'),
    [messages]
  )

  return (
    <div
      className={cn('relative w-full flex-col items-center gap-4 pb-36')}
      ref={messagesRef}
    >
      {/* Historical Message Area */}
      {historicalMessages.length > 0 && (
        <div className="w-full pt-16">
          {historicalMessages.map((message, messageIndex) => (
            <Message
              key={`historical-message-${message.id}-${messageIndex}`}
              message={message}
              status={status}
              fetchStatus={fetchStatus}
              isLastAssistantMessage={false}
            />
          ))}
          <motion.div className="my-10 flex items-center justify-center">
            <span className="rounded-full border-[1px] border-neutral-200 bg-white px-4 py-1 font-medium text-neutral-500 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
              Previous <span className="font-normal">conversation</span>
            </span>
          </motion.div>
        </div>
      )}

      {/* Latest Message Area - Full height */}
      <div
        className={cn(
          'w-full',
          historicalMessages.length > 0
            ? 'min-h-[70vh]'
            : 'min-h-[calc(100vh-200px)] pt-16',
          'flex flex-col gap-4'
        )}
      >
        {latestMessages.map((message, messageIndex) => (
          <Message
            key={`latest-message-${message.id}-${messageIndex}`}
            message={message}
            status={status}
            fetchStatus={fetchStatus}
            isLastAssistantMessage={
              message.role === 'assistant' &&
              messageIndex === latestMessages.length - 1 &&
              message.id === messages[lastAssistantIndex]?.id
            }
          />
        ))}

        {fetchStatus &&
          fetchStatus !== 'Success' &&
          status !== 'submitted' &&
          status !== 'ready' && (
            <ShinyText
              text={fetchStatus}
              disabled={false}
              speed={2}
              className="-mt-11 w-full font-light text-sm"
            />
          )}

        {status === 'submitted' && (
          <ShinyText
            text="Connecting..."
            disabled={false}
            speed={2}
            className="w-full font-light text-sm"
          />
        )}

        {/* Invisible element at bottom to serve as a scroll anchor */}
        <div
          ref={bottomAnchorRef}
          data-scroll-anchor="true"
          style={{ height: '1px', width: '100%' }}
        />
      </div>

      <AnimatePresence initial={false}>
        {/* Scroll to bottom button */}
        {showScrollButton && (
          <div
            className={cn('fixed bottom-[150px] left-0 w-full transition-all', {
              'lg:left-32': sidebarOpen,
            })}
          >
            <motion.button
              initial={{ opacity: 0, scale: 0.8, filter: 'blur(5px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.8, filter: 'blur(5px)' }}
              className="z-10 mx-auto flex size-6 items-center justify-center rounded-full bg-black shadow-md transition-colors hover:bg-neutral-700 dark:bg-neutral-700 dark:hover:bg-neutral-600"
              onClick={scrollToBottom}
              title="Scroll to bottom"
            >
              <ArrowDownIcon className="size-3 text-neutral-100 dark:text-neutral-200" />
            </motion.button>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
