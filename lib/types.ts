import type { Message } from 'ai'

export interface ChatSession {
  id: string
  userId: string
  title: string
  createdAt: Date
  updatedAt: Date
  messages: Message[]
}

export interface UserChatHistory {
  sessions: ChatSession[]
}
