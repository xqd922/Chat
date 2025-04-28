import { AnimatePresence, m as motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { type AvatarData, AvatarGroup } from '../avatar-group'

export type BaseAnnotation = {
  type: string
}

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

// 创建一个Portal容器来渲染弹窗
const PopupPortal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // 确保只在客户端渲染
  if (!mounted) return null

  return createPortal(children, document.body)
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
  const [popupStyles, setPopupStyles] = useState<React.CSSProperties>({
    position: 'fixed',
    top: '-1000px',
    left: '-1000px',
    zIndex: 9999,
    opacity: 0,
  })

  // 引用
  const containerRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const citationRefs = useRef<Map<number, HTMLAnchorElement>>(new Map())

  // 保存点击时的初始滚动位置
  const initialScrollYRef = useRef(0)

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
      marginTop: '0.5rem',
      marginBottom: '0.5rem',
    },
  }

  // 完全重写定位弹窗的逻辑
  const positionPopup = useCallback(() => {
    if (activeCitation === null || !popupRef.current) return

    const citationElem = citationRefs.current.get(activeCitation)
    if (!citationElem) return

    // 获取点击元素的位置信息（相对于视口）
    const citationRect = citationElem.getBoundingClientRect()

    // 获取弹窗信息以计算是否会溢出
    const popupRect = popupRef.current.getBoundingClientRect()

    // 初始位置计算（相对于视口）
    let left = citationRect.left
    let top = citationRect.bottom + 5 // 初始位置在引用下方5px处

    // 检查右侧是否会溢出视口
    const rightOverflow = left + popupRect.width - window.innerWidth
    if (rightOverflow > 0) {
      // 如果会溢出右侧，向左移动
      left = Math.max(20, left - rightOverflow - 20)
    }

    // 检查底部是否会溢出视口
    const bottomOverflow = top + popupRect.height - window.innerHeight
    if (bottomOverflow > 0) {
      // 如果会溢出底部，尝试放在引用上方
      const topPosition = citationRect.top - popupRect.height - 5

      // 只有当放在上方不会超出视口顶部时才采用上方位置
      if (topPosition > 0) {
        top = topPosition
      } else {
        // 如果上下都放不下，优先选择底部，但尽量显示更多内容
        top = Math.max(20, window.innerHeight - popupRect.height - 20)
      }
    }

    // 设置新位置
    setPopupStyles({
      position: 'fixed',
      top: `${top}px`, // 使用固定定位（相对视口）而不是绝对定位
      left: `${left}px`,
      zIndex: 9999,
      opacity: 1,
      maxHeight: '80vh',
      overflowY: 'auto',
    })
  }, [activeCitation])

  // 处理引用点击事件
  const handleCitationClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, citationIndex: number) => {
      e.preventDefault()
      e.stopPropagation()

      // 存储元素引用和当前滚动位置
      citationRefs.current.set(citationIndex, e.currentTarget)
      initialScrollYRef.current = window.scrollY

      // 先隐藏弹窗并设置激活状态
      setPopupStyles((prev) => ({ ...prev, opacity: 0 }))
      setActiveCitation(citationIndex)
    },
    []
  )

  // 当激活的引用改变时，更新弹窗位置
  useEffect(() => {
    if (activeCitation === null) {
      // 隐藏弹窗
      setPopupStyles((prev) => ({ ...prev, opacity: 0 }))
      return
    }

    // 使用RAF确保DOM已更新
    const rafId = requestAnimationFrame(() => {
      // 两次RAF能确保DOM完全更新
      requestAnimationFrame(() => {
        positionPopup()
      })
    })

    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [activeCitation, positionPopup])

  // 处理点击外部关闭弹窗
  useEffect(() => {
    if (activeCitation === null) return

    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setActiveCitation(null)
      }
    }

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveCitation(null)
      }
    }

    // 添加事件监听器
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscapeKey)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [activeCitation])

  // 添加滚动和调整大小事件监听器 - 使用防抖技术
  useEffect(() => {
    if (activeCitation === null) return

    let scrollTimeoutId: number | null = null
    let resizeTimeoutId: number | null = null

    const handleScroll = () => {
      // 清除之前的定时器
      if (scrollTimeoutId) {
        window.clearTimeout(scrollTimeoutId)
      }

      // 设置新的定时器，避免频繁触发
      scrollTimeoutId = window.setTimeout(() => {
        positionPopup()
      }, 10) // 10ms足够平滑但不会导致性能问题
    }

    const handleResize = () => {
      // 清除之前的定时器
      if (resizeTimeoutId) {
        window.clearTimeout(resizeTimeoutId)
      }

      // 设置新的定时器，避免频繁触发
      resizeTimeoutId = window.setTimeout(() => {
        positionPopup()
      }, 100)
    }

    // 添加事件监听器
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)

    return () => {
      // 清理
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)

      if (scrollTimeoutId) {
        window.clearTimeout(scrollTimeoutId)
      }

      if (resizeTimeoutId) {
        window.clearTimeout(resizeTimeoutId)
      }
    }
  }, [activeCitation, positionPopup])

  // 监控弹窗大小变化
  useEffect(() => {
    if (!popupRef.current || activeCitation === null) return

    // 使用ResizeObserver监控弹窗大小变化
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        positionPopup()
      })
    })

    resizeObserver.observe(popupRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [activeCitation, positionPopup])

  const websiteIconList = annotation.map((item) => {
    return {
      src: item.icon_url,
      name: item.title,
    } as AvatarData
  })

  return (
    <div className="flex flex-col" ref={containerRef}>
      <button
        type="button"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setIsExpanded(!isExpanded)
          }
        }}
        key={`annotation-${messageId}-${index}`}
        className="flex w-fit cursor-pointer flex-row items-center justify-between gap-1 rounded-full border border-neutral-200 bg-white py-1 pr-1 pl-2 text-xs transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800/50 dark:hover:bg-neutral-700/70"
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
                    ref={(el) => {
                      if (el) citationRefs.current.set(i, el)
                    }}
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
        <PopupPortal>
          <div
            ref={popupRef}
            className="max-w-md rounded-[20px] border border-neutral-200 bg-white px-4 py-3 shadow-lg shadow-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:shadow-none"
            style={popupStyles}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="mb-1 font-medium">
              {annotation[activeCitation].title ||
                `Source ${activeCitation + 1}`}
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
        </PopupPortal>
      )}
    </div>
  )
}
