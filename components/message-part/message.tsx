import { cn } from '@/lib/utils'
import type { UseChatHelpers } from '@ai-sdk/react'
import { ArrowPathIcon, ClipboardIcon } from '@heroicons/react/24/outline'
import type { UIMessage } from 'ai'
import { memo } from 'react'
import ShinyText from '../shiny-text'
import {
  type Annotation,
  AnnotationDisplay,
  type BaseAnnotation,
} from './annotation'
import { ReasoningMessagePart } from './reasoning-message'
import { TextMessagePart } from './text-message'

interface MessageProps {
  message: UIMessage
  status: UseChatHelpers['status']
  fetchStatus?: string
  isLastAssistantMessage: boolean
  onRegenerate: () => void
}

export type InfoAnnotation = {
  type: string
  model: string
  waiting_time: number
}

export const Message = memo(
  ({
    message,
    status,
    fetchStatus,
    isLastAssistantMessage,
    onRegenerate,
  }: MessageProps) => {
    // 展平所有 annotation.results 以便根据引用索引查找
    const allResults =
      message.annotations?.flatMap((annotation) => {
        const typedAnnotation = annotation as Annotation | null
        return typedAnnotation?.results || []
      }) || []

    // 替换引用标识为 Markdown 图标链接
    const replaceCitations = (text: string) => {
      if (allResults.length === 0) {
        return text
      }
      return text.replace(/\[(\d+)\]/g, (match, numStr) => {
        const num = Number.parseInt(numStr, 10)
        // 检查索引是否在有效范围内
        if (num >= 1 && num <= allResults.length) {
          const result = allResults[num - 1] // 索引从 0 开始，因此减 1
          return `[ ![citation ${num}](${result.icon_url}) ](${result.url})`
        }
        return match // 如果索引无效，保留原始文本
      })
    }

    // 提取出annotations中类型为info的内容
    let infoAnnotation: InfoAnnotation | undefined
    message.annotations?.flatMap((annotation) => {
      const baseAnnotation = annotation as BaseAnnotation
      // 过滤掉非搜索结果类型的注释
      if (baseAnnotation.type !== 'info') {
        return []
      }
      infoAnnotation = annotation as InfoAnnotation
    })
    // Add a message ID-based key for message parts to improve rendering
    return (
      <div className={cn('flex w-full flex-col gap-4')}>
        <div
          className={cn('flex flex-col gap-2', {
            'mb-3 ml-auto w-fit rounded-lg bg-neutral-100 px-2 py-1 dark:bg-neutral-700/50':
              message.role === 'user',
            '': message.role === 'assistant',
          })}
        >
          {message.annotations?.map((annotation, index) => {
            const baseAnnotation = annotation as BaseAnnotation
            if (baseAnnotation.type !== 'search_results') {
              return null
            }
            const annotationList = annotation as Annotation
            return (
              <AnnotationDisplay
                key={`annotation-display-${message.id}-${index}`}
                annotation={annotationList.results}
                messageId={message.id}
                index={index}
              />
            )
          })}
          {message.role === 'assistant' &&
            message.content.length === 0 &&
            (fetchStatus === 'Success' || !fetchStatus) && (
              <ShinyText
                text="Generating..."
                disabled={false}
                speed={2}
                className="w-full font-light text-sm"
              />
            )}
          {message.parts.map((part, partIndex) => {
            // Generate a stable key based on content hash or other unique identifiers
            const partKey = `${message.id}-${partIndex}-${part.type}`

            if (part.type === 'text' && message.role !== 'user') {
              return (
                <TextMessagePart
                  key={partKey}
                  text={replaceCitations(part.text)}
                />
              )
            }
            if (part.type === 'text' && message.role === 'user') {
              return (
                <div
                  key={partKey}
                  className="flex flex-col gap-4 font-light text-sm"
                >
                  {part.text}
                </div>
              )
            }
            if (part.type === 'reasoning') {
              return (
                <ReasoningMessagePart
                  key={partKey}
                  // @ts-expect-error export ReasoningUIPart
                  part={part}
                  isReasoning={
                    status === 'streaming' &&
                    isLastAssistantMessage &&
                    partIndex === message.parts.length - 1
                  }
                />
              )
            }
          })}
        </div>
        {/* 总是保留按钮的空间，但内容可以根据条件显示，这样可以避免布局偏移 */}
        <div className="-mt-3 -ml-0.5 flex h-6 items-center justify-start gap-2 transition-opacity">
          {message.role === 'assistant' &&
            (!isLastAssistantMessage || status !== 'streaming') && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(message.content)
                  }}
                  title="Copy to clipboard"
                >
                  <ClipboardIcon className="size-4 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300" />
                </button>
                <button
                  disabled={status === 'streaming'}
                  className={'disabled:cursor-not-allowed'}
                  type="button"
                  onClick={onRegenerate}
                  title="Regenerate response"
                >
                  <ArrowPathIcon className="size-4 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300" />
                </button>
                {infoAnnotation && (
                  <div className="mt-[1px] text-[11px] text-neutral-500 dark:text-neutral-400">
                    <span className="font-medium">Model: </span>
                    {infoAnnotation.model} {' | '}
                    <span className="font-medium">Latency: </span>
                    {infoAnnotation.waiting_time}ms
                  </div>
                )}
              </>
            )}
        </div>
      </div>
    )
  },
  (prevProps, nextProps) => {
    // Enhanced memoization logic that includes content changes in individual parts
    if (
      prevProps.message.id !== nextProps.message.id ||
      prevProps.status !== nextProps.status ||
      prevProps.isLastAssistantMessage !== nextProps.isLastAssistantMessage ||
      prevProps.fetchStatus !== nextProps.fetchStatus
    ) {
      return false
    }

    // Check if content has changed
    if (prevProps.message.content !== nextProps.message.content) {
      return false
    }

    // Deep check of parts array if needed
    if (prevProps.message.parts.length !== nextProps.message.parts.length) {
      return false
    }

    // We've checked all critical props and found them equal, so don't re-render
    return true
  }
)

Message.displayName = 'Message'
