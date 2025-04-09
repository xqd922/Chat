import type { Message } from 'ai'
import { cache } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from './supabase-client'
import type { ChatSession } from './types'

const TABLE_NAME = 'chat_sessions'

// Simple in-memory cache
const memoryCache: Record<string, { data: any; expiry: number }> = {}
const CACHE_TTL = 60 * 1000 // 1 minute cache

// Helper function to set cache
function setMemoryCache(key: string, data: any) {
  memoryCache[key] = {
    data,
    expiry: Date.now() + CACHE_TTL,
  }
}

// Helper function to get from cache
function getMemoryCache<T>(key: string): T | null {
  const cached = memoryCache[key]
  if (cached && cached.expiry > Date.now()) {
    return cached.data as T
  }
  delete memoryCache[key] // Clear expired cache
  return null
}

// Get all chat sessions for a user with caching
export const getUserSessions = cache(
  async (userId: string): Promise<ChatSession[]> => {
    // Check memory cache first
    const cacheKey = `user_sessions_${userId}`
    const cachedSessions = getMemoryCache<ChatSession[]>(cacheKey)

    if (cachedSessions) {
      return cachedSessions
    }

    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('userid', userId)
        .order('updatedat', { ascending: false })

      if (error) {
        console.error('Failed to get user sessions:', error)
        return []
      }

      // Make sure messages is always an array
      const sessions = (data || []).map((session) => ({
        ...session,
        messages: Array.isArray(session.messages) ? session.messages : [],
      }))

      // Cache the result
      setMemoryCache(cacheKey, sessions)

      return sessions
    } catch (error) {
      console.error('Failed to get user sessions:', error)
      return []
    }
  }
)

// Create a new chat session
export async function createChatSession(
  userId: string,
  title = 'New Chat'
): Promise<ChatSession> {
  const newSession: ChatSession = {
    id: uuidv4(),
    userid: userId,
    title,
    createdat: new Date(),
    updatedat: new Date(),
    messages: [],
  }

  try {
    const { error } = await supabase.from(TABLE_NAME).insert(newSession)

    if (error) {
      console.error('Failed to create chat session:', error)
    } else {
      // Invalidate user sessions cache when creating a new session
      delete memoryCache[`user_sessions_${userId}`]
    }
  } catch (error) {
    console.error('Failed to create chat session:', error)
  }

  return newSession
}

// Get a specific chat session with caching
export const getChatSession = async (
  userId: string,
  sessionId: string
): Promise<ChatSession | null> => {
  // Check memory cache first
  const cacheKey = `chat_session_${userId}_${sessionId}`
  const cachedSession = getMemoryCache<ChatSession>(cacheKey)

  if (cachedSession) {
    return cachedSession
  }

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('userid', userId)
      .eq('id', sessionId)
      .single()

    if (error) {
      console.error('Failed to get chat session:', error)
      return null
    }

    // Make sure messages is always an array
    const session = data
      ? {
          ...data,
          messages: Array.isArray(data.messages) ? data.messages : [],
        }
      : null

    // Cache the result
    if (session) {
      setMemoryCache(cacheKey, session)
    }

    return session
  } catch (error) {
    console.error('Failed to get chat session:', error)
    return null
  }
}

// Save messages to a specific chat session
export async function saveMessages(
  userId: string,
  sessionId: string,
  messages: Message[]
): Promise<void> {
  try {
    let title = 'New Chat'

    // Update title based on the first user message if title is generic
    if (messages.length > 0) {
      const firstUserMessage = messages.find((m) => m.role === 'user')
      if (firstUserMessage) {
        const content = firstUserMessage.content.substring(0, 30)
        title = content + (content.length > 30 ? '...' : '')
      }
    }

    const { error } = await supabase
      .from(TABLE_NAME)
      .update({
        messages,
        updatedat: new Date(),
        title: title !== 'New Chat' ? title : undefined, // Only update title if it changed
      })
      .eq('userid', userId)
      .eq('id', sessionId)

    if (error) {
      console.error('Failed to save messages:', error)
    } else {
      // Invalidate caches when data changes
      delete memoryCache[`chat_session_${userId}_${sessionId}`]
      delete memoryCache[`user_sessions_${userId}`]
    }
  } catch (error) {
    console.error('Failed to save messages:', error)
  }
}

// Delete a chat session
export async function deleteChatSession(
  userId: string,
  sessionId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('userid', userId)
      .eq('id', sessionId)

    if (error) {
      console.error('Failed to delete chat session:', error)
    } else {
      // Invalidate caches when data is deleted
      delete memoryCache[`chat_session_${userId}_${sessionId}`]
      delete memoryCache[`user_sessions_${userId}`]
    }
  } catch (error) {
    console.error('Failed to delete chat session:', error)
  }
}
