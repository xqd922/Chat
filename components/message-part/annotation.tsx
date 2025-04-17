import { AnimatePresence, m as motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { type AvatarData, AvatarGroup } from '../avatar-group'

export type Annotation = {
  type: string
  title: string
  results: Array<AnnotationResult>
}

export type AnnotationResult = {
  title: string
  url: string
  content: string
  icon_url: string
}

export function AnnotationDisplay({
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
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        setActiveCitation(null)
      }
    }

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

    const rect = e.currentTarget.getBoundingClientRect()
    const x = rect.left
    const y = rect.bottom + window.scrollY + 5

    setPopupPosition({ x, y })
    setActiveCitation(citationIndex)
  }

  const websiteIconList = annotation.map((item) => {
    return {
      src: item.icon_url,
      name: item.title,
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
          onClick={(e) => e.stopPropagation()}
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
