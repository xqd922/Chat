import Link from 'next/link'
import type { Components } from 'react-markdown'

export const markdownComponents: Partial<Components> = {
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
    <pre className="overflow-x-auto rounded-lg bg-neutral-100 p-2 text-black dark:bg-neutral-800 dark:text-white">
      {children}
    </pre>
  ),
  ol: ({ children, ...props }) => {
    return (
      <ol className="ml-6 list-outside list-decimal" {...props}>
        {children}
      </ol>
    )
  },
  code: ({ className, children }) => {
    const match = /language-(\w+)/.exec(className || '')
    return match ? (
      <pre className="overflow-x-auto rounded-lg bg-neutral-100 p-2 text-black dark:bg-neutral-800 dark:text-white">
        <code className={`language-${match[1]} text-sm`}>{children}</code>
      </pre>
    ) : (
      <code className="mx-[1px] rounded-md bg-neutral-200 px-1 text-[12px] dark:bg-neutral-800">
        {children}
      </code>
    )
  },
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
      <h1 className="mt-6 mb-2 font-semibold text-3xl" {...props}>
        {children}
      </h1>
    )
  },
  h2: ({ children, ...props }) => {
    return (
      <h2 className="mt-6 mb-2 font-semibold text-2xl" {...props}>
        {children}
      </h2>
    )
  },
  h3: ({ children, ...props }) => {
    return (
      <h3 className="mt-6 mb-2 font-semibold text-xl" {...props}>
        {children}
      </h3>
    )
  },
  h4: ({ children, ...props }) => {
    return (
      <h4 className="mt-6 mb-2 font-semibold text-lg" {...props}>
        {children}
      </h4>
    )
  },
  h5: ({ children, ...props }) => {
    return (
      <h5 className="mt-6 mb-2 font-semibold text-base" {...props}>
        {children}
      </h5>
    )
  },
  h6: ({ children, ...props }) => {
    return (
      <h6 className="mt-6 mb-2 font-semibold text-sm" {...props}>
        {children}
      </h6>
    )
  },
}
