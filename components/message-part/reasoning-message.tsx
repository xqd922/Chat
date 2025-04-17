import { AnimatePresence, m as motion } from 'framer-motion'
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
            {getReasoningTimeText()}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
