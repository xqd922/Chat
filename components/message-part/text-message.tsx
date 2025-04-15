import { MemoizedReactMarkdown } from '@/components/markdown'
import { memo } from 'react'
import rehypeExternalLinks from 'rehype-external-links'
import remarkGfm from 'remark-gfm'
import { markdownComponents } from '../markdown-components'

interface TextMessagePartProps {
  text: string
}

// Memoize TextMessagePart to prevent unnecessary re-renders
const MemoizedTextMessagePart = memo(
  ({ text }: TextMessagePartProps) => (
    <MemoizedReactMarkdown
      rehypePlugins={[[rehypeExternalLinks, { target: '_blank' }]]}
      remarkPlugins={[remarkGfm]}
      components={markdownComponents}
    >
      {text}
    </MemoizedReactMarkdown>
  ),
  (prevProps, nextProps) => prevProps.text === nextProps.text
)
MemoizedTextMessagePart.displayName = 'MemoizedTextMessagePart'

export function TextMessagePart({ text }: TextMessagePartProps) {
  return <MemoizedTextMessagePart text={text} />
}
