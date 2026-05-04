import { createClient, RedisClientType } from 'redis'
import dotenv from 'dotenv'

dotenv.config()

const redisUrl = process.env.REDIS_URL || ''
const isRedisConfigured = Boolean(redisUrl)
let client: RedisClientType | null = null

if (isRedisConfigured) {
  client = createClient({ url: redisUrl })
  client.on('error', (error: Error) => {
    console.error('Redis client error:', error)
  })
}

export const connectRedis = async (): Promise<void> => {
  if (!isRedisConfigured || !client) {
    console.log('⚠️ Redis cache disabled: set REDIS_URL to enable caching')
    return
  }

  try {
    if (!client.isOpen) {
      await client.connect()
      console.log(`✓ Redis connected: ${redisUrl}`)
    }
  } catch (error: any) {
    console.warn('⚠️ Unable to connect to Redis, continuing without cache:', error.message)
  }
}

export const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    if (!client || !client.isOpen) {
      return null
    }
    const result = await client.get(key)
    if (!result) {
      return null
    }
    return JSON.parse(result) as T
  } catch (error) {
    console.error('Cache get error:', error)
    return null
  }
}

export const setCache = async (key: string, value: any, ttlSeconds = 60): Promise<void> => {
  try {
    if (!client || !client.isOpen) {
      return
    }
    await client.set(key, JSON.stringify(value), { EX: ttlSeconds })
  } catch (error) {
    console.error('Cache set error:', error)
  }
}

export const invalidateCacheByPattern = async (pattern: string): Promise<void> => {
  try {
    if (!client || !client.isOpen) {
      return
    }
    const keys = await client.keys(pattern)
    if (keys.length > 0) {
      await client.del(keys)
    }
  } catch (error) {
    console.error('Cache invalidate error:', error)
  }
}
