'use client'

import { cn } from '@/lib/utils'
import { memo, useEffect, useRef, useState } from 'react'
import { codeToHtml } from 'shiki'

export const CodeBlock = ({
  children,
  className,
  ...props
}: React.HTMLProps<HTMLPreElement>) => {
  return (
    <pre
      className={cn(
        'group relative mt-2 mb-3 overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900',
        className
      )}
      {...props}
    >
      {children}
    </pre>
  )
}

export const CodeBlockGroup = ({
  children,
  className,
  ...props
}: React.HTMLProps<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        'flex h-9 items-center justify-between bg-neutral-100 dark:bg-neutral-800/50',
        className
      )}
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
    'w-full overflow-x-auto text-[13px] [&>pre]:px-4 [&>pre]:py-4'
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

    // 不要在每次渲染时都设置 isProcessing
    // 只在实际需要处理时设置
    const isLargeCode = code.length > 5000
    const debounceTime = isLargeCode ? 300 : 100

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
          const errorName = error?.name ? error.name : ''
          if (errorName !== 'AbortError') {
            console.error('Error highlighting code:', error)
          }
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
    />
  ) : (
    <div className={classNames}>
      <pre>
        <code>{code}</code>
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
