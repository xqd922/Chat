'use client'

import { CheckIcon, ClipboardIcon } from '@heroicons/react/24/outline'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

type ButtonCopyProps = {
  code: string
}

export function ButtonCopy({ code }: ButtonCopyProps) {
  const [hasCopyLabel, setHasCopyLabel] = useState(false)

  const onCopy = () => {
    navigator.clipboard.writeText(code)
    setHasCopyLabel(true)

    setTimeout(() => {
      setHasCopyLabel(false)
    }, 1000)
  }

  return (
    <button
      onClick={onCopy}
      type="button"
      className="mr-1 inline-flex items-center justify-center gap-1.5 rounded-md font-medium text-[11px]"
    >
      <AnimatePresence initial={false} mode="wait">
        {hasCopyLabel ? (
          <motion.div
            key="check"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <CheckIcon className="size-[15px] text-green-600" />
          </motion.div>
        ) : (
          <motion.div
            key="clipboard"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <ClipboardIcon className="h-[13px] w-[15px]" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  )
}
