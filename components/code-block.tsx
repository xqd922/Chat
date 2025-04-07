'use client'

import { cn } from '@/lib/utils'
import { Highlight, themes } from 'prism-react-renderer'
import { memo } from 'react'

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
  return (
    <Highlight theme={themes.github} code={code} language={language as any}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className={cn('overflow-auto p-4 pb-4 text-sm', className)}
          style={style}
        >
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  )
}

// Memoized version to prevent re-renders
export const CodeBlockCode = memo(
  CodeBlockCodeBase,
  (prevProps, nextProps) =>
    prevProps.code === nextProps.code &&
    prevProps.language === nextProps.language
)
