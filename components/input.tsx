'use client'

import { DefaultModelID, ModelList, type modelID } from '@/lib/models'
import {
  IsReasoningEnabled,
  IsSearchEnabled,
  SelectedModelId,
} from '@/lib/nusq'
import { useChat } from '@ai-sdk/react'
import { parseAsBoolean, parseAsStringLiteral, useQueryState } from 'nuqs'
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

  const { append, setData } = useChat({
    id: 'primary',
    body: {
      selectedModelId: selectedModelId,
      isReasoningEnabled: isReasoningEnabled,
      isSearchEnabled: isSearchEnabled,
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
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()

        if (input === '') {
          return
        }

        if (isGeneratingResponse) {
          toast.error('Please wait for the model to finish its response!')
          return
        }

        setData(undefined)
        append({
          role: 'user',
          content: input,
          createdAt: new Date(),
        })
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
