'use client'

import { useChat } from '@ai-sdk/react'
import cn from 'classnames'
import UserControl from './user-control'
import UserMessages from './user-messages'

export function Chat() {
  const { messages } = useChat({
    id: 'primary',
  })
  return (
    <div
      className={cn(
        'flex h-dvh w-full max-w-3xl flex-col items-center px-4 pt-8 pb-4 md:px-0',
        {
          'justify-between': messages.length > 0,
          'justify-center gap-4': messages.length === 0,
        }
      )}
    >
      <UserMessages />
      <UserControl />
    </div>
  )
}
