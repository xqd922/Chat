import Link from 'next/link'

export function Footnote() {
  return (
    <div className="hidden text-neutral-400 text-xs leading-5 sm:block">
      This preview is built using{' '}
      <Link
        className="underline underline-offset-2"
        href="https://nextjs.org/"
        target="_blank"
      >
        Next.js
      </Link>{' '}
      and the{' '}
      <Link
        className="underline underline-offset-2"
        href="https://sdk.vercel.ai/"
        target="_blank"
      >
        AI SDK
      </Link>
    </div>
  )
}
