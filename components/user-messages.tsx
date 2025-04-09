import { saveMessages } from '@/lib/message-storage'
import { DefaultModelID, ModelList, type modelID } from '@/lib/models'
import {
  IsReasoningEnabled,
  IsSearchEnabled,
  SelectedModelId,
  UserSession,
} from '@/lib/nusq'
import { useChat } from '@ai-sdk/react'
import { useUser } from '@clerk/nextjs'
import type { UIMessage } from 'ai'
import {
  parseAsBoolean,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from 'nuqs'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Messages } from './messages'

interface UserMessagesProps {
  messages: UIMessage[]
}

export default function UserMessages({ messages }: UserMessagesProps) {
  const [sessionId] = useQueryState<string>(UserSession, parseAsString)

  const { user, isSignedIn } = useUser()

  const [selectedModelId] = useQueryState<modelID>(
    SelectedModelId,
    parseAsStringLiteral(ModelList).withDefault(DefaultModelID)
  )
  const [isReasoningEnabled] = useQueryState<boolean>(
    IsReasoningEnabled,
    parseAsBoolean.withDefault(true)
  )
  const [isSearchEnabled] = useQueryState<boolean>(
    IsSearchEnabled,
    parseAsBoolean.withDefault(false)
  )

  // Use a consistent chat ID across components
  const chatId = sessionId || 'primary'

  const { status, data, reload, setMessages } = useChat({
    id: chatId,
    body: {
      selectedModelId: selectedModelId,
      isReasoningEnabled: isReasoningEnabled,
      isSearchEnabled: isSearchEnabled,
    },
    onError: () => {
      toast.error('An error occurred, please try again!')
    },
  })

  // Get the status of the last message
  const fetchStatus =
    data && data.length > 0
      ? typeof data[data.length - 1] === 'object' &&
        data[data.length - 1] !== null
        ? (data[data.length - 1] as { status?: string })?.status || undefined
        : undefined
      : undefined

  // Track if these are initial messages loaded from storage
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const previousMessagesCountRef = useRef(0)

  // Reference to track the current session ID for avoiding race conditions
  const currentSessionIdRef = useRef<string | null>(null)

  // Reference to track the last saved messages to prevent unnecessary saves
  const lastSavedMessagesRef = useRef<string>('')

  // Create a memoized string representation of messages for comparison
  const messagesSignature = useMemo(() => {
    return JSON.stringify(
      messages.map((m) => ({
        id: m.id,
        content: m.content,
        role: m.role,
      }))
    )
  }, [messages])

  // Update the ref whenever the sessionId changes
  useEffect(() => {
    currentSessionIdRef.current = sessionId
  }, [sessionId])

  // Set initial load flag when component mounts or session changes
  useEffect(() => {
    if (sessionId) {
      setInitialLoadComplete(false)
      previousMessagesCountRef.current = 0
    }
  }, [sessionId])

  // Mark initial load as complete after a brief delay
  useEffect(() => {
    if (messages.length > 0 && !initialLoadComplete) {
      const timer = setTimeout(() => {
        setInitialLoadComplete(true)
        previousMessagesCountRef.current = messages.length
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [messages.length, initialLoadComplete])

  // Save messages when they change and AI response is complete
  useEffect(() => {
    const saveUserMessages = async () => {
      if (isSignedIn && user && sessionId && messages.length > 0) {
        // Only save when not actively generating a response
        if (status === 'ready') {
          // Skip saving initial load
          if (!initialLoadComplete) {
            console.log('Skipping save - initial messages load')
            return
          }

          // Skip if no new messages since initial load
          if (
            messages.length <= previousMessagesCountRef.current &&
            initialLoadComplete
          ) {
            console.log('Skipping save - no new messages since initial load')
            return
          }

          // Check if messages have actually changed
          if (messagesSignature !== lastSavedMessagesRef.current) {
            // Capture the current session ID at the time we start saving
            const saveSessionId = sessionId

            console.log(
              `Saving ${messages.length} messages for session ${saveSessionId}`
            )

            // Only proceed with saving if this is still the current session
            if (saveSessionId === currentSessionIdRef.current) {
              await saveMessages(user.id, saveSessionId, messages)
              // Update the last saved messages reference
              lastSavedMessagesRef.current = messagesSignature
              previousMessagesCountRef.current = messages.length
            } else {
              console.log(
                `Aborted saving messages: session changed from ${saveSessionId} to ${currentSessionIdRef.current}`
              )
            }
          } else {
            console.log('Skipping save - messages have not changed')
          }
        }
      }
    }
    saveUserMessages()
  }, [
    status,
    messages,
    messagesSignature,
    sessionId,
    isSignedIn,
    user,
    initialLoadComplete,
  ])

  return (
    <>
      {messages.length > 0 ? (
        <Messages
          messages={messages}
          status={status}
          fetchStatus={fetchStatus}
          reload={reload}
          setMessages={setMessages}
        />
      ) : (
        <div className="flex w-full flex-col gap-0.5 text-xl sm:text-2xl">
          <div className="flex flex-row items-center gap-2">
            <div>Welcome👋</div>
          </div>
          <div className="text-neutral-400 dark:text-neutral-500">
            What would you like me to think about today?
          </div>
        </div>
      )}
    </>
  )
}
