import { UserSession } from '@/lib/nusq'
import { useChat } from '@ai-sdk/react'
import type { UIMessage } from 'ai'
import { parseAsString, useQueryState } from 'nuqs'
import { toast } from 'sonner'
import { Loader } from './loader'
import { Messages } from './messages'

interface UserMessagesProps {
  messages: UIMessage[]
  isLoading: boolean
}

export default function UserMessages({
  messages,
  isLoading,
}: UserMessagesProps) {
  const [sessionId] = useQueryState<string>(UserSession, parseAsString)

  // Use a consistent chat ID across components
  const chatId = sessionId || 'primary'

  const { status, data } = useChat({
    id: chatId,
    onError: () => {
      toast.error('An error occurred, please try again!')
    },
  })

  // Get the status of the last message
  const fetchStatus =
    data && data.length > 0
      ? typeof data[data.length - 1] === 'object' &&
        data[data.length - 1] !== null
        ? (data[data.length - 1] as { status?: string; type?: string })
            ?.type === 'fetch'
          ? (data[data.length - 1] as { status?: string })?.status || undefined
          : undefined
        : undefined
      : undefined

  return (
    <>
      {isLoading ? (
        <Loader visible={isLoading} />
      ) : messages.length > 0 ? (
        <Messages
          messages={messages}
          status={status}
          fetchStatus={fetchStatus}
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
