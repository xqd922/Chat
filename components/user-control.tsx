'use client'

import {
  DefaultModelID,
  ModelGroups,
  ModelList,
  ReasoningModelList,
  type modelID,
  models,
} from '@/lib/models'
import { useChat } from '@ai-sdk/react'
import {
  ArrowUpIcon,
  GlobeAltIcon,
  LightBulbIcon,
} from '@heroicons/react/24/solid'
import { parseAsBoolean, parseAsStringLiteral, useQueryState } from 'nuqs'
import { memo, useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import {
  IsReasoningEnabled,
  IsSearchEnabled,
  SelectedModelId,
} from '@/lib/nusq'
import { cn } from '@/lib/utils'
import { useUser } from '@clerk/nextjs'
import { ChevronDownIcon } from './icons'

interface UserControlProps {
  sessionId: string
}

export const scroolToBottom = () => {
  // Ensure we scroll to the very bottom by using a small delay
  setTimeout(() => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    })
  }, 100)
}

const UserControl = memo(function UserControl({ sessionId }: UserControlProps) {
  const { isSignedIn } = useUser()
  const [isMobile, setIsMobile] = useState(false)

  // Use a consistent chat ID across components
  const chatId = sessionId || 'primary'

  const [selectedModelId, setSelectedModelId] = useQueryState<modelID>(
    SelectedModelId,
    parseAsStringLiteral(ModelList).withDefault(DefaultModelID)
  )
  const [isReasoningEnabled, setIsReasoningEnabled] = useQueryState<boolean>(
    IsReasoningEnabled,
    parseAsBoolean.withDefault(ReasoningModelList.includes(selectedModelId))
  )
  const [isSearchEnabled, setIsSearchEnabled] = useQueryState<boolean>(
    IsSearchEnabled,
    parseAsBoolean.withDefault(false)
  )

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

  const { input, handleSubmit, handleInputChange, status } = useChat({
    id: chatId,
    experimental_prepareRequestBody({ messages }) {
      return {
        message: messages[messages.length - 1],
        selectedModelId: selectedModelId,
        isReasoningEnabled: isReasoningEnabled,
        isSearchEnabled: isSearchEnabled,
        sessionId: chatId,
      }
    },
    onError: () => {
      toast.error('An error occurred, please try again!')
    },
  })

  const isGeneratingResponse = ['streaming', 'submitted'].includes(status)

  const toggleReasoning = useCallback(() => {
    setIsReasoningEnabled((prev) => !prev)
  }, [setIsReasoningEnabled])

  const toggleSearch = useCallback(() => {
    setIsSearchEnabled((prev) => !prev)
  }, [setIsSearchEnabled])

  const handleModelChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newModelId = event.target.value as modelID
      setSelectedModelId(newModelId)
      if (ReasoningModelList.includes(newModelId)) {
        setIsReasoningEnabled(true)
      } else {
        setIsReasoningEnabled(false)
      }
    },
    [setSelectedModelId, setIsReasoningEnabled]
  )

  return (
    <div
      className={cn(
        'fixed right-0 bottom-2 z-10 flex w-full flex-col items-center justify-center gap-4 px-4 py-2 transition-all duration-300',
        isSignedIn && !isMobile ? 'lg:left-32' : 'left-0'
      )}
    >
      <form
        onSubmit={handleSubmit}
        className="relative mx-auto flex w-full max-w-3xl flex-col gap-1 rounded-2xl border-[1px] border-neutral-200/60 bg-neutral-100 px-2 py-3 shadow-lg shadow-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:shadow-none"
      >
        <textarea
          className="mx-2 my-1 mb-12 min-h-12 w-full resize-none bg-transparent text-sm outline-none placeholder:font-light placeholder:text-neutral-300 placeholder:text-sm dark:placeholder:text-neutral-500"
          placeholder="Send a message"
          value={input}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              // Prevent default behavior of Enter key
              e.preventDefault()
              if (input.trim() && !isGeneratingResponse) {
                // @ts-expect-error err
                const form = e.target.closest('form')
                if (form) form.requestSubmit()
              }
              scroolToBottom()
            }
          }}
        />
        <div className="absolute bottom-2.5 left-3 flex flex-col gap-1 sm:flex-row sm:items-center">
          <button
            disabled={true}
            type="button"
            className={cn(
              'flex cursor-pointer items-center gap-1 rounded-full bg-neutral-400 px-2 py-1 font-medium text-white text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition-colors hover:shadow-[inset_0_1px_0_rgba(0,0,0,0.2)] disabled:cursor-not-allowed dark:bg-neutral-600',
              {
                'bg-green-600 dark:bg-green-700': isReasoningEnabled,
              }
            )}
            onClick={toggleReasoning}
          >
            <LightBulbIcon className={cn('mb-[2px] size-[10px]')} />
            <p className="[text-shadow:_0_1px_0_rgb(0_0_0_/_20%)]">Think</p>
          </button>
          <button
            type="button"
            className={cn(
              'flex cursor-pointer items-center gap-1 rounded-full bg-neutral-400 px-2 py-1 font-medium text-white text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition-colors hover:shadow-[inset_0_1px_0_rgba(0,0,0,0.2)] disabled:cursor-not-allowed dark:bg-neutral-600',
              {
                'bg-blue-600 dark:bg-blue-700': isSearchEnabled,
              }
            )}
            onClick={toggleSearch}
          >
            <GlobeAltIcon className={cn('mb-[2px] size-[10px]')} />
            <p className="[text-shadow:_0_1px_0_rgb(0_0_0_/_20%)]">Search</p>
          </button>
        </div>
        <div className="absolute right-2.5 bottom-1.5 flex flex-row gap-2">
          <div className="relative flex w-fit cursor-pointer flex-row items-center gap-0.5 rounded-lg p-1.5 text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700">
            <div className="flex items-center justify-center px-1 text-neutral-500 text-xs dark:text-neutral-500">
              <span className="pr-1">{models[selectedModelId]}</span>
              <ChevronDownIcon />
            </div>

            <select
              className="absolute left-0 w-full cursor-pointer p-1 opacity-0"
              value={selectedModelId}
              onChange={handleModelChange}
            >
              {ModelGroups.map((group) => (
                <optgroup key={group.name} label={group.name}>
                  {group.models.map((modelId) => (
                    <option key={modelId} value={modelId}>
                      {models[modelId]}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {isGeneratingResponse ? (
            <button
              type="button"
              className={cn(
                'mt-0.5 flex size-6 flex-row items-center justify-center rounded-full bg-neutral-900 px-1.5 text-neutral-100 transition-all hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300',
                {
                  'dark:bg-neutral-200 dark:text-neutral-500':
                    isGeneratingResponse || input === '',
                }
              )}
              disabled
            >
              <div className="size-4 animate-spin">
                <svg
                  className="size-4 text-white dark:text-black"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            </button>
          ) : (
            <button
              type="submit"
              onClick={scroolToBottom}
              className={cn(
                'mt-0.5 flex h-6 w-6 flex-row items-center justify-center rounded-full bg-neutral-900 p-1.5 text-neutral-100 transition-all dark:bg-neutral-100 dark:text-black ',
                {
                  'dark:bg-neutral-200 dark:text-neutral-500':
                    isGeneratingResponse || input === '',
                }
              )}
            >
              <ArrowUpIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  )
})

export default UserControl
