import { cn } from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '../icons'
import { MemoizedReactMarkdown } from '../markdown'
import { markdownComponents } from '../markdown-components'
import ShinyText from '../shiny-text'

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
  const [isExpanded, setIsExpanded] = useState(false)
  const [reasoningSeconds, setReasoningSeconds] = useState<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // Start timing when reasoning begins
    if (isReasoning && !startTimeRef.current) {
      startTimeRef.current = Date.now()

      // Update the timer every 100ms for a smooth display
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsedSeconds = (Date.now() - startTimeRef.current) / 1000
          setReasoningSeconds(elapsedSeconds)
        }
      }, 100)
    }

    // Stop timing when reasoning ends
    if (!isReasoning && startTimeRef.current) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      // Set final time
      const finalTime = (Date.now() - startTimeRef.current) / 1000
      setReasoningSeconds(finalTime)
      startTimeRef.current = null
    }

    // Clean up timer when component unmounts
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isReasoning])

  useEffect(() => {
    if (!isReasoning) {
      setIsExpanded(false)
    }
  }, [isReasoning])

  // Format the reasoning time display
  const getReasoningTimeText = () => {
    if (reasoningSeconds === null) {
      return 'Reasoned for a few seconds'
    }

    if (reasoningSeconds < 1) {
      return 'Reasoned for less than a second'
    }
    if (reasoningSeconds === 1) {
      return 'Reasoned for 1 second'
    }
    return `Reasoned for ${reasoningSeconds.toFixed(1)} seconds`
  }

  return (
    <div className="relative flex flex-col">
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
            {getReasoningTimeText()}
          </p>
        )}

        {isExpanded ? <ChevronDownIcon /> : <ChevronUpIcon />}
      </button>
      {!isExpanded && (
        <div className="pointer-events-none absolute bottom-0 left-0 h-16 w-full bg-gradient-to-t from-neutral-100 to-transparent dark:from-neutral-900" />
      )}
      <div
        key="reasoning"
        className={cn(
          'mt-2 flex flex-col gap-4 overflow-hidden border-l pl-3 text-[#54545494] text-sm dark:border-neutral-800 dark:text-[#b5b5b5a4]',
          {
            'max-h-[100px]': !isExpanded,
            'max-h-full': isExpanded,
          }
        )}
      >
        {part.details.map((detail, detailIndex) =>
          detail.type === 'text' ? (
            <MemoizedReactMarkdown
              key={`${detailIndex}-${detail.text}`}
              components={markdownComponents}
            >
              {detail.text}
            </MemoizedReactMarkdown>
          ) : (
            '<redacted>'
          )
        )}
      </div>
    </div>
  )
}
