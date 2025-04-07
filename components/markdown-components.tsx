import { cn } from '@/lib/utils'
import Link from 'next/link'
import { memo } from 'react'
import type { Components } from 'react-markdown'
import { ButtonCopy } from './button-copy'
import { CodeBlock, CodeBlockCode, CodeBlockGroup } from './code-block'

function extractLanguage(className?: string): string {
  if (!className) return 'plaintext'
  const match = className.match(/language-(\w+)/)
  return match ? match[1] : 'plaintext'
}

// Memoized inline code component
const InlineCode = memo(
  ({
    className,
    children,
  }: { className?: string; children: React.ReactNode }) => (
    <span
      className={cn(
        'mx-0.5 rounded-sm bg-neutral-200/80 px-1 font-mono text-[13px] dark:bg-neutral-700',
        className
      )}
    >
      {children}
    </span>
  )
)
InlineCode.displayName = 'InlineCode'

// Memoized block code component
const CodeComponent = memo(
  function CodeComponent({ className, children, node }: any) {
    const isInline =
      !node?.position?.start.line ||
      node?.position?.start.line === node?.position?.end.line

    if (isInline) {
      return <InlineCode className={className}>{children}</InlineCode>
    }

    const language = extractLanguage(className)
    const codeString = children as string

    return (
      <CodeBlock
        className={`${className} p-[2px] dark:bg-neutral-700/30`}
        style={{ maxWidth: '100%', overflowX: 'auto' }}
      >
        <CodeBlockGroup className="flex h-9 items-center justify-between px-4">
          <div className="py-1 pr-2 font-semibold text-xs">
            {language.toLocaleUpperCase()}
          </div>
        </CodeBlockGroup>
        <div className="sticky top-0">
          <div className="absolute right-0 bottom-0 flex h-9 items-center pr-1.5">
            <ButtonCopy code={codeString} />
          </div>
        </div>
        <CodeBlockCode code={codeString} language={language} />
      </CodeBlock>
    )
  },
  (prevProps, nextProps) => {
    return (
      prevProps.children === nextProps.children &&
      prevProps.className === nextProps.className
    )
  }
)
CodeComponent.displayName = 'CodeComponent'

export const markdownComponents: Partial<Components> = {
  hr: () => {
    return <hr className=" hidden" />
  },
  p: ({ children }) => {
    const isPreTag =
      Array.isArray(children) &&
      children.length > 0 &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (children[0] as any)?.type === 'pre'
    if (isPreTag) {
      return <>{children}</>
    }
    return <p className="font-light text-sm leading-6">{children}</p>
  },
  pre: ({ children }) => (
    <pre
      className="overflow-x-auto"
      style={{
        maxWidth: '100%',
        overflowX: 'auto',
        wordBreak: 'break-word',
      }}
    >
      {children}
    </pre>
  ),
  img: ({ src, alt, ...props }) => {
    const isCitation = alt?.includes('citation')

    if (isCitation) {
      return (
        <span className="inline-flex items-center align-middle">
          <img
            aria-label="citation"
            className="mx-0 my-0 inline-block size-4 rounded-full border-[1px] border-neutral-200 bg-white align-middle dark:border-neutral-800 dark:bg-black"
            src={src}
            alt={alt}
            {...props}
          />
        </span>
      )
    }

    return (
      <img
        aria-label="image"
        className="mx-auto mb-4 max-h-[500px] max-w-full rounded-lg"
        src={src}
        alt={alt}
        {...props}
      />
    )
  },
  ol: ({ children, ...props }) => {
    return (
      <ol className="ml-6 list-outside list-decimal" {...props}>
        {children}
      </ol>
    )
  },
  code: CodeComponent,
  li: ({ children, ...props }) => {
    return (
      <li className="py-1 font-light text-sm" {...props}>
        {children}
      </li>
    )
  },
  ul: ({ children, ...props }) => {
    return (
      <ul className="ml-6 list-outside list-decimal" {...props}>
        {children}
      </ul>
    )
  },
  strong: ({ children, ...props }) => {
    return (
      <span className="font-semibold" {...props}>
        {children}
      </span>
    )
  },
  a: ({ children, ...props }) => {
    return (
      // @ts-expect-error - Link component expects href prop from markdown-parsed anchor tags
      <Link
        className="text-blue-500 hover:underline"
        target="_blank"
        rel="noreferrer"
        {...props}
      >
        {children}
      </Link>
    )
  },
  h1: ({ children, ...props }) => {
    return (
      <h1 className="mt-4 mb-2 font-semibold text-3xl" {...props}>
        {children}
      </h1>
    )
  },
  h2: ({ children, ...props }) => {
    return (
      <h2 className="mt-4 mb-2 font-semibold text-2xl" {...props}>
        {children}
      </h2>
    )
  },
  h3: ({ children, ...props }) => {
    return (
      <h3 className="mt-4 mb-2 font-semibold text-xl" {...props}>
        {children}
      </h3>
    )
  },
  h4: ({ children, ...props }) => {
    return (
      <h4 className="mt-4 mb-2 font-semibold text-lg" {...props}>
        {children}
      </h4>
    )
  },
  h5: ({ children, ...props }) => {
    return (
      <h5 className="mt-4 mb-2 font-semibold text-base" {...props}>
        {children}
      </h5>
    )
  },
  h6: ({ children, ...props }) => {
    return (
      <h6 className="mt-4 mb-2 font-semibold text-sm" {...props}>
        {children}
      </h6>
    )
  },
}
