import {
  DefaultModelID,
  ModelList,
  ReasoningModelList,
  type modelID,
  models,
} from '@/lib/models'
import { useChat } from '@ai-sdk/react'
import { GlobeAltIcon, LightBulbIcon } from '@heroicons/react/24/solid'
import { parseAsBoolean, parseAsStringLiteral, useQueryState } from 'nuqs'
import { memo, useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Input } from './input'

import {
  IsReasoningEnabled,
  IsSearchEnabled,
  SelectedModelId,
} from '@/lib/nusq'
import { cn } from '@/lib/utils'
import { ArrowUpIcon, ChevronDownIcon, StopIcon } from './icons'

const UserControl = memo(function UserControl() {
  const [input, setInput] = useState<string>('')
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

  const isGeneratingResponse = useMemo(() => {
    return ['streaming', 'submitted'].includes(status)
  }, [status])

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

  const handleSubmit = useCallback(() => {
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
  }, [input, isGeneratingResponse, stop, setData, append, setInput])

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="relative flex w-full flex-col gap-1 rounded-2xl border-[1px] border-neutral-200/60 bg-neutral-100 px-2 py-3 shadow-lg shadow-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:shadow-none">
        <Input
          input={input}
          setInput={setInput}
          isGeneratingResponse={isGeneratingResponse}
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
        <div className="absolute right-2.5 bottom-2.5 flex flex-row gap-2">
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
            onClick={handleSubmit}
          >
            {isGeneratingResponse ? <StopIcon /> : <ArrowUpIcon />}
          </button>
        </div>
      </div>
    </div>
  )
})

export default UserControl
