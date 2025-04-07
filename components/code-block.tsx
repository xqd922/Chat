'use client'

import { cn } from '@/lib/utils'
import { memo, useEffect, useRef, useState } from 'react'
import { codeToHtml } from 'shiki'

export const CodeBlock = ({
  children,
  className,
  ...props
}: React.HTMLProps<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        'not-prose my-2 flex w-full flex-col overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-black',
        className
      )}
      style={{ maxWidth: '100%' }}
      {...props}
    >
      {children}
    </div>
  )
}

export const CodeBlockGroup = ({
  children,
  className,
  ...props
}: React.HTMLProps<HTMLDivElement>) => {
  return (
    <div
      className={cn('flex items-center justify-between', className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface CodeBlockCodeProps {
  code: string
  language: string
}

// Non-memoized version that will be wrapped
const CodeBlockCodeBase = ({ code, language }: CodeBlockCodeProps) => {
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const classNames = cn(
    'w-full overflow-x-auto text-[13px] rounded-[8px] shadow-sm border-[1px] dark:bg-black border-neutral-200/50 dark:border-neutral-700/80',
    '[&>pre]:px-4 [&>pre]:py-4 [&>pre]:overflow-x-auto',
    '[&>pre]:w-full [&>pre]:whitespace-pre',
    '[&_code]:block [&_code]:overflow-x-auto [&_code]:break-all [&_code]:whitespace-pre-wrap'
  )

  useEffect(() => {
    // Cancel any ongoing highlight operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Clear any pending debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    const debounceTime = 1000

    // 只在实际开始处理时设置状态
    const processId = setTimeout(() => {
      if (!isProcessing) {
        setIsProcessing(true)
      }

      const executeHighlight = async () => {
        try {
          abortControllerRef.current = new AbortController()
          const signal = abortControllerRef.current.signal

          // Simple wrapper to make the shiki call abortable
          const abortableHighlight = async () => {
            if (signal.aborted) return null

            return await codeToHtml(code, {
              lang: language || 'plaintext', // 确保始终有语言值
              themes: {
                light: 'github-light',
                dark: 'github-dark',
              },
            })
          }

          const html = await abortableHighlight()

          if (!signal.aborted && html) {
            setHighlightedHtml(html)
          }
        } catch (error) {
          // 检查错误对象是否有 name 属性
          console.error('Error highlighting code:', error)
        } finally {
          setIsProcessing(false)
        }
      }

      executeHighlight()
    }, debounceTime)

    debounceTimerRef.current = processId

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [code, language])

  return highlightedHtml ? (
    <div
      className={classNames}
      dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      style={{
        maxWidth: '100%',
        overflowX: 'auto',
      }}
    />
  ) : (
    <div
      className={classNames}
      style={{
        maxWidth: '100%',
        overflowX: 'auto',
      }}
    >
      <pre
        className="w-full"
        style={{
          maxWidth: '100%',
          overflowX: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        <code
          className="block overflow-x-auto"
          style={{ wordBreak: 'break-word' }}
        >
          {code}
        </code>
      </pre>
    </div>
  )
}

// Memoized version to prevent re-renders
export const CodeBlockCode = memo(
  CodeBlockCodeBase,
  (prevProps, nextProps) =>
    prevProps.code === nextProps.code &&
    prevProps.language === nextProps.language
)
