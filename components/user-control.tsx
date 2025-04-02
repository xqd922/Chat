import { ModelList, type modelID, models } from '@/lib/models'
import { useChat } from '@ai-sdk/react'
import { GlobeAltIcon, LightBulbIcon } from '@heroicons/react/24/outline'
import cn from 'classnames'
import { parseAsBoolean, parseAsStringLiteral, useQueryState } from 'nuqs'
import { useState } from 'react'
import { toast } from 'sonner'
import { Input } from './input'

import {
  IsReasoningEnabled,
  IsSearchEnabled,
  SelectedModelId,
} from '@/lib/nusq'
import { Footnote } from './footnote'
import { ArrowUpIcon, ChevronDownIcon, StopIcon } from './icons'

export default function UserControl() {
  const [input, setInput] = useState<string>('')
  const [selectedModelId, setSelectedModelId] = useQueryState<modelID>(
    SelectedModelId,
    parseAsStringLiteral(ModelList).withDefault('medical-70B')
  )
  const [isReasoningEnabled, setIsReasoningEnabled] = useQueryState<boolean>(
    IsReasoningEnabled,
    parseAsBoolean.withDefault(selectedModelId.includes('deepseek-r1'))
  )
  const [isSearchEnabled, setIsSearchEnabled] = useQueryState<boolean>(
    IsSearchEnabled,
    parseAsBoolean.withDefault(false)
  )

  const { append, status, stop, setData } = useChat({
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

  const isGeneratingResponse = ['streaming', 'submitted'].includes(status)

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="relative flex w-full flex-col gap-1 rounded-2xl border-[1px] border-neutral-200/60 bg-neutral-100 p-3 shadow-lg shadow-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:shadow-none">
        <Input
          input={input}
          setInput={setInput}
          isGeneratingResponse={isGeneratingResponse}
        />

        <div className="absolute bottom-2.5 left-2.5 flex flex-col sm:flex-row sm:items-center">
          <button
            disabled={true}
            type="button"
            className={cn(
              'relative flex w-fit cursor-pointer flex-row items-center gap-2 rounded-full px-2 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50',
              {
                'text-green-700': isReasoningEnabled,
              }
            )}
            onClick={() => {
              setIsReasoningEnabled(!isReasoningEnabled)
            }}
          >
            <LightBulbIcon className={cn('size-4')} />
            <div>Reasoning</div>
          </button>
          <button
            type="button"
            className={cn(
              'relative flex w-fit cursor-pointer flex-row items-center gap-2 rounded-full px-2 py-1 text-xs transition-colors disabled:opacity-50',
              {
                'text-blue-700 dark:text-blue-500': isSearchEnabled,
              }
            )}
            onClick={() => {
              setIsSearchEnabled(!isSearchEnabled)
            }}
          >
            <GlobeAltIcon className={cn('size-4')} />
            <div>Web Search</div>
          </button>
        </div>

        <div className="absolute right-2.5 bottom-2.5 flex flex-row gap-2">
          <div className="relative flex w-fit cursor-pointer flex-row items-center gap-0.5 rounded-lg p-1.5 text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700">
            <div className="flex items-center justify-center px-1 text-neutral-500 text-xs dark:text-neutral-500">
              <span className="pr-1">{models[selectedModelId]}</span>
              <ChevronDownIcon />
            </div>

            <select
              className="absolute left-0 w-full cursor-pointer p-1 opacity-0"
              value={selectedModelId}
              onChange={(event) => {
                if (!event.target.value.includes('deepseek-r1')) {
                  setIsReasoningEnabled(false)
                } else {
                  setIsReasoningEnabled(true)
                }
                setSelectedModelId(event.target.value as modelID)
              }}
            >
              {Object.entries(models).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className={cn(
              'mt-0.5 flex size-6 flex-row items-center justify-center rounded-full bg-neutral-900 p-1.5 text-neutral-100 transition-all hover:scale-105 hover:bg-neutral-800 active:scale-95 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300',
              {
                'dark:bg-neutral-200 dark:text-neutral-500':
                  isGeneratingResponse || input === '',
              }
            )}
            onClick={() => {
              if (input === '') {
                return
              }

              if (isGeneratingResponse) {
                stop()
              } else {
                setData(undefined)
                append({
                  role: 'user',
                  content: input,
                  createdAt: new Date(),
                })
              }

              setInput('')
            }}
          >
            {isGeneratingResponse ? <StopIcon /> : <ArrowUpIcon />}
          </button>
        </div>
      </div>
      <Footnote />
    </div>
  )
}
