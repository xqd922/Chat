import type { ChatSession } from '@/lib/types'

// 会话缓存接口
interface SessionCache {
  [key: string]: {
    data: ChatSession
    timestamp: number
  }
}

// 缓存过期时间（5分钟）
const CACHE_EXPIRY = 5 * 60 * 1000

class SessionCacheManager {
  private cache: SessionCache = {}
  private maxSize = 10 // 最大缓存会话数

  // 获取缓存的会话数据
  get(sessionId: string): ChatSession | null {
    const cached = this.cache[sessionId]
    if (!cached) return null

    // 检查缓存是否过期
    if (Date.now() - cached.timestamp > CACHE_EXPIRY) {
      delete this.cache[sessionId]
      return null
    }

    return cached.data
  }

  // 设置会话缓存
  set(sessionId: string, data: ChatSession) {
    // 如果缓存已满，删除最旧的缓存
    if (Object.keys(this.cache).length >= this.maxSize) {
      const oldestKey = Object.entries(this.cache).reduce(
        (oldest, [key, value]) => {
          return value.timestamp < this.cache[oldest].timestamp ? key : oldest
        },
        Object.keys(this.cache)[0]
      )
      delete this.cache[oldestKey]
    }

    this.cache[sessionId] = {
      data,
      timestamp: Date.now(),
    }
  }

  // 清除指定会话的缓存
  clear(sessionId: string) {
    delete this.cache[sessionId]
  }

  // 清除所有缓存
  clearAll() {
    this.cache = {}
  }
}

export const sessionCache = new SessionCacheManager()
