import { saveMessages } from '@/lib/message-storage'
import { DefaultModelID, ModelList, type modelID } from '@/lib/models'
import {
  IsReasoningEnabled,
  IsSearchEnabled,
  SelectedModelId,
} from '@/lib/nusq'
import { useChat } from '@ai-sdk/react'
import { useUser } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { parseAsBoolean, parseAsStringLiteral, useQueryState } from 'nuqs'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { Messages } from './messages'

export default function UserMessages() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')
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

  const { messages, status, data, reload, setMessages } = useChat({
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

  // Save messages when they change and AI response is complete
  useEffect(() => {
    const saveUserMessages = async () => {
      if (isSignedIn && user && sessionId && messages.length > 0) {
        // Only save when not actively generating a response
        if (status === 'ready') {
          console.log(
            `Saving ${messages.length} messages for session ${sessionId}`
          )
          await saveMessages(user.id, sessionId, messages)
        }
      }
    }
    saveUserMessages()
  }, [status])

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
