'use client'

import { MemoizedReactMarkdown } from '@/components/markdown'
import { cn } from '@/lib/utils'
import type { UseChatHelpers } from '@ai-sdk/react'
import { ArrowPathIcon, ClipboardIcon } from '@heroicons/react/24/outline'
import type { UIMessage } from 'ai'
import { AnimatePresence, motion } from 'framer-motion'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import type React from 'react'
import Markdown from 'react-markdown'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { type AvatarData, AvatarGroup } from './avatar-group'
import { ChevronDownIcon, ChevronUpIcon } from './icons'
import { markdownComponents } from './markdown-components'
import ShinyText from './shiny-text'

interface ReasoningPart {
  type: 'reasoning'
  reasoning: string
  details: Array<{ type: 'text'; text: string }>
}

interface ReasoningMessagePartProps {
  part: ReasoningPart
  isReasoning: boolean
}

export function ReasoningMessagePart({
  part,
  isReasoning,
}: ReasoningMessagePartProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const variants = {
    collapsed: {
      height: 0,
      opacity: 0,
      marginTop: 0,
      marginBottom: 0,
    },
    expanded: {
      height: 'auto',
      opacity: 1,
      marginTop: '1rem',
      marginBottom: 0,
    },
  }

  useEffect(() => {
    if (!isReasoning) {
      setIsExpanded(false)
    }
  }, [isReasoning])

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => {
          setIsExpanded(!isExpanded)
        }}
        className="flex cursor-pointer flex-row items-center gap-2"
      >
        {isReasoning ? (
          <ShinyText
            text="Reasoning"
            disabled={false}
            speed={2}
            className="font-light text-sm"
          />
        ) : (
          <p className="font-light text-[#54545494] text-sm transition-colors hover:text-black/80 dark:text-[#b5b5b5a4] dark:hover:text-white/80">
            Reasoned for a few seconds
          </p>
        )}

        {isExpanded ? <ChevronDownIcon /> : <ChevronUpIcon />}
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="reasoning"
            className="flex flex-col gap-4 border-l pl-3 text-[#54545494] text-sm dark:border-neutral-800 dark:text-[#b5b5b5a4]"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={variants}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            {part.details.map((detail, detailIndex) =>
              detail.type === 'text' ? (
                <Markdown
                  key={`${detailIndex}-${detail.text}`}
                  components={markdownComponents}
                >
                  {detail.text}
                </Markdown>
              ) : (
                '<redacted>'
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface TextMessagePartProps {
  text: string
}

type Annotation = {
  type: string
  title: string
  results: Array<AnnotationResult>
}

type AnnotationResult = {
  title: string
  url: string
  content: string
}

// Update the AnnotationDisplay component to handle popups
function AnnotationDisplay({
  annotation,
  messageId,
  index,
}: {
  annotation: AnnotationResult[]
  messageId: string
  index: number
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeCitation, setActiveCitation] = useState<number | null>(null)
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 })
  const popupRef = useRef<HTMLDivElement>(null)

  const variants = {
    collapsed: {
      height: 0,
      opacity: 0,
      marginTop: 0,
      marginBottom: 0,
      filter: 'blur(5px)',
    },
    expanded: {
      height: 'auto',
      opacity: 1,
      marginTop: '0.5rem',
      marginBottom: '0.5rem',
      filter: 'blur(0px)',
    },
  }

  useEffect(() => {
    // Add global click event to close popup when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        setActiveCitation(null)
      }
    }

    // Add escape key handler
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveCitation(null)
      }
    }

    if (activeCitation !== null) {
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('keydown', handleEscKey)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [activeCitation])

  const handleCitationClick = (e: React.MouseEvent, citationIndex: number) => {
    e.preventDefault()
    e.stopPropagation()

    // Calculate position for popup
    const rect = e.currentTarget.getBoundingClientRect()
    const x = rect.left
    const y = rect.bottom + window.scrollY + 5 // Show popup below the citation

    setPopupPosition({ x, y })
    setActiveCitation(citationIndex)
  }

  const websiteIconList = annotation.map((item) => {
    const url = new URL(item.url)
    const hostname = url.hostname
    const iconUrl = `https://favicon.im/${hostname}`
    return {
      src: iconUrl,
      name: hostname,
    } as AvatarData
  })

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setIsExpanded(!isExpanded)
          }
        }}
        key={`annotation-${messageId}-${index}`}
        className="flex w-fit cursor-pointer flex-row items-center justify-between gap-1 rounded-full border border-neutral-200 bg-neutral-50 py-1 pr-1 pl-2 text-xs transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800/50 dark:hover:bg-neutral-700/70"
        onClick={() => setIsExpanded(!isExpanded)}
        tabIndex={0}
      >
        <p className={'font-semibold'}>{annotation.length}</p> Webpages
        <AvatarGroup
          avatars={websiteIconList}
          overlap={'sm'}
          size={'xs'}
          max={5}
        />
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="annotation-list"
            className="mt-2 flex flex-col gap-2 text-neutral-700 text-xs dark:text-neutral-300"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={variants}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <ul className="list-disc space-y-1 pl-5">
              {annotation.map((item, i) => (
                <li key={`${messageId}-${index}-${i + 1}`}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-blue-600 hover:underline dark:text-blue-400"
                    onClick={(e) => handleCitationClick(e, i)}
                  >
                    {item.title || item.url}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Citation Popup */}
      {activeCitation !== null && (
        <div
          ref={popupRef}
          className="fixed z-10 max-w-md rounded-[20px] border border-neutral-200 bg-white px-4 py-3 shadow-lg shadow-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:shadow-none"
          style={{
            top: `${popupPosition.y}px`,
            left: `${popupPosition.x}px`,
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setActiveCitation(null)
            }
          }}
          onClick={(e) => e.stopPropagation()} // Prevent clicks inside popup from closing it
        >
          <h4 className="mb-1 font-medium">
            {annotation[activeCitation].title || `Source ${activeCitation + 1}`}
          </h4>
          <p className="mb-2 break-all text-neutral-500 text-xs dark:text-neutral-400">
            <a
              href={annotation[activeCitation].url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {annotation[activeCitation].url}
            </a>
          </p>
          <p className="text-sm">
            {annotation[activeCitation].content.substring(0, 200)}...
          </p>
          <button
            type="button"
            className="mt-2 text-blue-600 text-xs hover:underline dark:text-blue-400"
            onClick={() => setActiveCitation(null)}
          >
            Close
          </button>
        </div>
      )}
    </div>
  )
}

const preprocessLaTeX = (content: string) => {
  const blockProcessedContent = content.replace(
    /\\\[([\s\S]*?)\\]/g,
    (_, equation) => `$$${equation}$$`
  )

  return blockProcessedContent.replace(
    /\\\(([\s\S]*?)\\\)/g,
    (_, equation) => `$${equation}$`
  )
}

export function TextMessagePart({ text }: TextMessagePartProps) {
  const containsLaTeX = /\\\[([\s\S]*?)\\]|\\\(([\s\S]*?)\\\)/.test(text || '')
  const processedData = preprocessLaTeX(text || '')

  if (containsLaTeX) {
    return (
      <MemoizedReactMarkdown
        rehypePlugins={[
          [rehypeExternalLinks, { target: '_blank' }],
          [rehypeKatex],
        ]}
        remarkPlugins={[remarkGfm, remarkMath]}
        components={markdownComponents}
      >
        {processedData}
      </MemoizedReactMarkdown>
    )
  }

  return (
    <MemoizedReactMarkdown
      rehypePlugins={[[rehypeExternalLinks, { target: '_blank' }]]}
      remarkPlugins={[remarkGfm]}
      components={markdownComponents}
    >
      {text}
    </MemoizedReactMarkdown>
  )
}

interface MessagesProps {
  messages: Array<UIMessage>
  status: UseChatHelpers['status']
  fetchStatus?: string
  reload?: () => void
  setMessages?: (messages: Array<UIMessage>) => void
}

interface MessageProps {
  message: UIMessage
  status: UseChatHelpers['status']
  fetchStatus?: string
  isLastAssistantMessage: boolean
  onRegenerate: () => void
}

const Message = memo(
  ({
    message,
    status,
    fetchStatus,
    isLastAssistantMessage,
    onRegenerate,
  }: MessageProps) => {
    return (
      <div
        className={cn(
          'flex w-full flex-col gap-4 first-of-type:mt-16 last-of-type:mb-12'
        )}
      >
        <div
          className={cn('flex flex-col gap-2', {
            'ml-auto w-fit rounded-lg bg-neutral-100 px-2 py-1 dark:bg-neutral-700/50':
              message.role === 'user',
            '': message.role === 'assistant',
          })}
        >
          {message.annotations?.map((annotation, index) => {
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
            if (part.type === 'text' && message.role !== 'user') {
              return (
                <motion.div
                  key={`${message.id}-${partIndex}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <TextMessagePart
                    key={`${message.id}-${partIndex}`}
                    text={part.text}
                  />
                </motion.div>
              )
            }
            if (part.type === 'text' && message.role === 'user') {
              return (
                <div
                  key={`${message.id}-${partIndex}`}
                  className="flex flex-col gap-4 font-light text-sm"
                >
                  {part.text}
                </div>
              )
            }
            if (part.type === 'reasoning') {
              return (
                <ReasoningMessagePart
                  key={`${message.id}-${partIndex}`}
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
        {message.role === 'assistant' &&
          (!isLastAssistantMessage || status !== 'streaming') && (
            <div className="-mt-3 -ml-0.5 flex justify-start gap-2 transition-opacity">
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
            </div>
          )}
      </div>
    )
  },
  (prevProps, nextProps) => {
    // Only re-render if these props have changed
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.content === nextProps.message.content &&
      prevProps.status === nextProps.status &&
      prevProps.isLastAssistantMessage === nextProps.isLastAssistantMessage
    )
  }
)

Message.displayName = 'Message'

export function Messages({
  messages,
  status,
  fetchStatus,
  reload,
  setMessages,
}: MessagesProps) {
  const messagesRef = useRef<HTMLDivElement>(null)
  const messagesLength = useMemo(() => messages.length, [messages])

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [messagesLength])

  const setMessagesAndReload = (messages: Array<UIMessage>) => {
    if (setMessages) {
      setMessages(messages)
    }
    if (reload) {
      reload()
    }
  }

  // Find last assistant message index for conditional rendering
  const lastAssistantIndex = useMemo(
    () => messages.findLastIndex((msg) => msg.role === 'assistant'),
    [messages]
  )

  return (
    <div
      className="scrollbar-hidden flex w-full flex-col items-center gap-4 overflow-y-scroll"
      ref={messagesRef}
    >
      {messages.map((message, messageIndex) => (
        <Message
          key={`message-${message.id}-${messageIndex}`}
          message={message}
          status={status}
          fetchStatus={fetchStatus}
          isLastAssistantMessage={
            message.role === 'assistant' && messageIndex === lastAssistantIndex
          }
          onRegenerate={() => {
            // Delete messages after this index
            const newMessages = messages.slice(0, messageIndex + 1)
            setMessagesAndReload(newMessages)
          }}
        />
      ))}

      {fetchStatus &&
        fetchStatus !== 'Success' &&
        status !== 'submitted' &&
        status !== 'ready' && (
          <ShinyText
            text={fetchStatus}
            disabled={false}
            speed={2}
            className="-mt-4 mb-12 w-full font-light text-sm"
          />
        )}
      {status === 'submitted' && (
        <ShinyText
          text="Connecting..."
          disabled={false}
          speed={2}
          className="mb-12 w-full font-light text-sm"
        />
      )}
    </div>
  )
}
