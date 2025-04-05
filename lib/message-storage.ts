import type { Message } from 'ai'
import { v4 as uuidv4 } from 'uuid'
import type { ChatSession, UserChatHistory } from './types'

const STORAGE_KEY = 'ai_chat_history'

// Get all chat sessions for a user
export function getUserSessions(userId: string): ChatSession[] {
  if (typeof window === 'undefined') return []

  try {
    const storageData = localStorage.getItem(STORAGE_KEY)
    if (!storageData) return []

    const allUserHistory: Record<string, UserChatHistory> =
      JSON.parse(storageData)
    return allUserHistory[userId]?.sessions || []
  } catch (error) {
    console.error('Failed to get user sessions:', error)
    return []
  }
}

// Create a new chat session
export function createChatSession(
  userId: string,
  title = 'New Chat'
): ChatSession {
  const newSession: ChatSession = {
    id: uuidv4(),
    userId,
    title,
    createdAt: new Date(),
    updatedAt: new Date(),
    messages: [],
  }

  const sessions = getUserSessions(userId)
  saveSessions(userId, [newSession, ...sessions])

  return newSession
}

// Get a specific chat session
export function getChatSession(
  userId: string,
  sessionId: string
): ChatSession | null {
  const sessions = getUserSessions(userId)
  return sessions.find((session) => session.id === sessionId) || null
}

// Save messages to a specific chat session
export function saveMessages(
  userId: string,
  sessionId: string,
  messages: Message[]
): void {
  const sessions = getUserSessions(userId)
  const sessionIndex = sessions.findIndex((session) => session.id === sessionId)

  if (sessionIndex !== -1) {
    sessions[sessionIndex].messages = messages
    sessions[sessionIndex].updatedAt = new Date()

    // Update title based on the first user message if title is generic
    if (sessions[sessionIndex].title === 'New Chat' && messages.length > 0) {
      const firstUserMessage = messages.find((m) => m.role === 'user')
      if (firstUserMessage) {
        const content = firstUserMessage.content.substring(0, 30)
        sessions[sessionIndex].title =
          content + (content.length > 30 ? '...' : '')
      }
    }

    saveSessions(userId, sessions)
  }
}

// Delete a chat session
export function deleteChatSession(userId: string, sessionId: string): void {
  let sessions = getUserSessions(userId)
  sessions = sessions.filter((session) => session.id !== sessionId)
  saveSessions(userId, sessions)
}

// Helper to save sessions to storage
function saveSessions(userId: string, sessions: ChatSession[]): void {
  if (typeof window === 'undefined') return

  try {
    const storageData = localStorage.getItem(STORAGE_KEY)
    const allUserHistory: Record<string, UserChatHistory> = storageData
      ? JSON.parse(storageData)
      : {}

    allUserHistory[userId] = { sessions }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allUserHistory))
  } catch (error) {
    console.error('Failed to save sessions:', error)
  }
}
