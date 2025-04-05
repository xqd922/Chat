'use client'

import { cn } from '@/lib/utils'
import { useChat } from '@ai-sdk/react'
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
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
      <header className="fixed top-0 right-0 z-10 flex w-full items-center justify-end p-4">
        <SignedIn>
          <UserButton userProfileMode="modal" />
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <div className=" cursor-pointer rounded-lg border px-4 py-2 font-medium text-sm shadow-sm transition-colors dark:border-neutral-700">
              Sign in
            </div>
          </SignInButton>
        </SignedOut>
      </header>
      <UserMessages />
      <UserControl />
    </div>
  )
}
