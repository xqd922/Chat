import type { Message } from 'ai'

export interface ChatSession {
  id: string
  userid: string // Changed from userId to match Supabase column name
  title: string
  createdat: Date // Changed from createdAt to match Supabase column name
  updatedat: Date // Changed from updatedAt to match Supabase column name
  messages: Message[]
}

export interface UserChatHistory {
  sessions: ChatSession[]
}
