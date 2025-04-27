'use client'

import {
  DefaultModelID,
  MODEL_CLAUDE_3,
  MODEL_DEEPSEEK,
  MODEL_GEMINI_2_5,
  MODEL_GPT4O,
  MODEL_GPT4_1,
  MODEL_GPT_O4,
  MODEL_GROK,
  MODEL_QWQ,
  ModelGroups,
  ModelList,
  ReasoningConfigurableModelList,
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
import {
  type RemixiconComponentType,
  RiAlibabaCloudFill,
  RiAnthropicFill,
  RiCopilotFill,
  RiGeminiFill,
  RiTiktokFill,
  RiTwitterXFill,
} from '@remixicon/react'
import { AnimatePresence, m as motion } from 'framer-motion'
import { parseAsBoolean, parseAsStringLiteral, useQueryState } from 'nuqs'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import {
  IsReasoningEnabled,
  IsSearchEnabled,
  SelectedModelId,
} from '@/lib/nusq'
import { cn } from '@/lib/utils'
import { useUser } from '@clerk/nextjs'
import React from 'react'
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

const modelMetrics: Record<
  string,
  { speed: number; iq: number; icon: RemixiconComponentType }
> = {
  [MODEL_DEEPSEEK]: { speed: 2, iq: 4, icon: RiTiktokFill },
  [MODEL_GPT4O]: { speed: 3, iq: 3, icon: RiCopilotFill },
  [MODEL_GPT4_1]: { speed: 4, iq: 3, icon: RiCopilotFill },
  [MODEL_GPT_O4]: { speed: 2, iq: 5, icon: RiCopilotFill },
  [MODEL_CLAUDE_3]: { speed: 1, iq: 3, icon: RiAnthropicFill },
  [MODEL_QWQ]: { speed: 5, iq: 2, icon: RiAlibabaCloudFill },
  [MODEL_GROK]: { speed: 3, iq: 2, icon: RiTwitterXFill },
  [MODEL_GEMINI_2_5]: { speed: 3, iq: 3, icon: RiGeminiFill },
}

// 评分指示器组件
const RatingIndicator = ({
  value,
  max = 5,
  colorClass,
}: { value: number; max?: number; colorClass: string }) => {
  return (
    <div className="flex">
      {[...Array(max)].map((_, i) => (
        <div
          key={i}
          className={cn(
            'mx-[1px] h-[10px] w-1 rounded-sm',
            i < value ? colorClass : 'bg-neutral-200 dark:bg-neutral-700'
          )}
        />
      ))}
    </div>
  )
}

const UserControl = memo(function UserControl({ sessionId }: UserControlProps) {
  const { isSignedIn } = useUser()
  const [sidebarOpen] = useQueryState<boolean>(
    'sidebarOpen',
    parseAsBoolean.withDefault(false)
  )

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

  const [isDropdownOpen, setIsDropdownOpen] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 阻止下拉菜单滚动事件传播到页面
  // 使用useEffect添加阻止滚动的事件监听
  useEffect(() => {
    // 定义处理滚轮事件的函数
    const preventScrollPropagation = (e: WheelEvent) => {
      // 只处理下拉菜单打开时的事件
      if (!isDropdownOpen || !dropdownRef.current) return

      // 检查事件是否来自下拉菜单
      const dropdown = dropdownRef.current.querySelector('.dropdown-content')
      if (!dropdown) return

      const rect = dropdown.getBoundingClientRect()
      const isMouseOverDropdown =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom

      if (isMouseOverDropdown) {
        // 获取滚动状态
        const { scrollTop, scrollHeight, clientHeight } =
          dropdown as HTMLElement
        const isAtTop = scrollTop === 0
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1 // 允许1px误差

        // 根据滚动方向和位置判断是否阻止默认行为
        if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
          e.preventDefault()
        }
      }
    }

    // 为整个窗口添加捕获阶段的事件监听，确保在事件到达下拉菜单之前捕获它
    window.addEventListener('wheel', preventScrollPropagation, {
      passive: false,
      capture: true,
    })

    return () => {
      window.removeEventListener('wheel', preventScrollPropagation, {
        capture: true,
      })
    }
  }, [isDropdownOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleModelSelect = (modelId: modelID) => {
    setSelectedModelId(modelId)
    if (ReasoningModelList.includes(modelId)) {
      setIsReasoningEnabled(true)
    } else {
      setIsReasoningEnabled(false)
    }
    setIsDropdownOpen(false)
  }

  // 获取当前选择模型的颜色
  const getSpeedColor = (modelId: string) => {
    const speed = modelMetrics[modelId]?.speed || 0
    if (speed >= 4) return 'bg-blue-500'
    if (speed === 3) return 'bg-blue-400'
    if (speed === 2) return 'bg-orange-400'
    return 'bg-red-500'
  }

  // 获取当前选择模型的IQ颜色
  const getIQColor = () => {
    return 'bg-purple-500'
  }

  return (
    <div
      className={cn(
        'fixed right-0 bottom-2 z-10 flex w-full flex-col items-center justify-center gap-4 px-4 py-2 transition-all duration-300',
        isSignedIn && sidebarOpen ? 'lg:left-32' : 'left-0'
      )}
    >
      <form
        onSubmit={handleSubmit}
        className="relative mx-auto flex w-full max-w-3xl flex-col gap-1 rounded-2xl border-[1px] border-neutral-200 bg-white px-2 py-3 shadow-lg shadow-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 dark:shadow-none"
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
            disabled={!ReasoningConfigurableModelList.includes(selectedModelId)}
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
          <div
            ref={dropdownRef}
            className="relative flex w-fit cursor-pointer flex-row items-center gap-0.5 p-1.5 text-sm"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div className="flex items-center justify-center px-1 text-neutral-500 text-xs dark:text-neutral-400">
              <span className="pr-1">{models[selectedModelId]}</span>
              <ChevronDownIcon />
            </div>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  className="dropdown-content absolute right-0 bottom-full z-50 mb-1 overflow-hidden rounded-[12px] border border-neutral-200 bg-neutral-100 p-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
                  initial={{
                    opacity: 0,
                    scale: 0.95,
                    y: 10,
                    filter: 'blur(5px)',
                  }}
                  animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.95, y: 10, filter: 'blur(5px)' }}
                  transition={{
                    duration: 0.2,
                    ease: 'easeOut',
                  }}
                >
                  <div
                    className="rounded-[8px] bg-white p-1 dark:bg-neutral-900"
                    style={{ overscrollBehavior: 'contain' }}
                  >
                    {ModelGroups.flatMap((group) =>
                      group.models.map((modelId) => (
                        <div
                          key={modelId}
                          className={cn(
                            'flex items-center justify-between rounded-[6px] px-2 py-2 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60',
                            modelId === selectedModelId
                              ? 'bg-neutral-100/70 dark:bg-neutral-800'
                              : ''
                          )}
                          onClick={() => handleModelSelect(modelId)}
                        >
                          <div className="flex items-center gap-2 whitespace-nowrap font-medium text-neutral-800 text-sm dark:text-neutral-200">
                            {modelMetrics[modelId]?.icon &&
                              React.createElement(modelMetrics[modelId].icon, {
                                size: 16,
                                className:
                                  'text-neutral-500 dark:text-neutral-400',
                              })}
                            {models[modelId]}
                          </div>
                          <div className="ml-8 flex items-center gap-4">
                            <div className="flex items-end gap-2">
                              <div className="flex items-center gap-1">
                                <span className="text-neutral-500 text-xs dark:text-neutral-400">
                                  Speed
                                </span>
                                <RatingIndicator
                                  value={modelMetrics[modelId]?.speed || 0}
                                  colorClass={getSpeedColor(modelId)}
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-neutral-500 text-xs dark:text-neutral-400">
                                  IQ
                                </span>
                                <RatingIndicator
                                  value={modelMetrics[modelId]?.iq || 0}
                                  colorClass={getIQColor()}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
