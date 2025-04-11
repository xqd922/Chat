'use client'

import { DefaultModelID, ModelList, type modelID } from '@/lib/models'
import {
  IsReasoningEnabled,
  IsSearchEnabled,
  SelectedModelId,
  UserSession,
} from '@/lib/nusq'
import { useChat } from '@ai-sdk/react'
import { useUser } from '@clerk/nextjs'
import {
  parseAsBoolean,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from 'nuqs'
import { memo, useCallback } from 'react'
import { toast } from 'sonner'

interface InputProps {
  input: string
  setInput: (value: string) => void
  isGeneratingResponse: boolean
}

export const Input = memo(function Input({
  input,
  setInput,
  isGeneratingResponse,
}: InputProps) {
  const { isSignedIn } = useUser()
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

  const [sessionId] = useQueryState<string>(UserSession, parseAsString)

  const chatId = sessionId || 'primary'
  const { append, setData } = useChat({
    id: chatId,
    body: {
      selectedModelId: selectedModelId,
      isReasoningEnabled: isReasoningEnabled,
      isSearchEnabled: isSearchEnabled,
      sessionId: sessionId,
    },
    onError: () => {
      toast.error('An error occurred, please try again!')
    },
  })

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(event.currentTarget.value)
    },
    [setInput]
  )

  const handleKeyDown = useCallback(
    async (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()

        if (input === '') {
          return
        }

        if (isGeneratingResponse) {
          toast.error('Please wait for the model to finish its response!')
          return
        }

        if (!isSignedIn) {
          toast.error('Please sign in to use this feature!')
          return
        }

        setData(undefined)
        append({
          role: 'user',
          content: input,
          createdAt: new Date(),
        })
        // Ensure we scroll to the very bottom by using a small delay
        setTimeout(() => {
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'auto',
          })
        }, 100)
        setInput('')
      }
    },
    [input, isGeneratingResponse, setData, append, setInput]
  )

  return (
    <textarea
      className="mx-2 my-1 mb-12 min-h-12 w-full resize-none bg-transparent text-sm outline-none placeholder:font-light placeholder:text-neutral-300 placeholder:text-sm dark:placeholder:text-neutral-500"
      placeholder="Send a message"
      value={input}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
    />
  )
})
