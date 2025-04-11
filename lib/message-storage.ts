import type { Message } from 'ai'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from './supabase-client'
import type { ChatSession } from './types'

const TABLE_NAME = 'chat_sessions'

// Get all chat sessions for a user with caching
export const getUserSessions = async (
  userId: string
): Promise<ChatSession[]> => {
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

    return sessions
  } catch (error) {
    console.error('Failed to get user sessions:', error)
    return []
  }
}

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
    await supabase.from(TABLE_NAME).insert(newSession)
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
    }
  } catch (error) {
    console.error('Failed to delete chat session:', error)
  }
}
