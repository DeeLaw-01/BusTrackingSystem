import Redis from 'ioredis' 

let redisClient: Redis | null = null
let redisPub: Redis | null = null
let redisSub: Redis | null = null
let redisEnabled = false

// In-memory fallback storage
const memoryStore = new Map<string, { data: any; expiresAt?: number }>()
const LOCATION_TTL = 30 // seconds

export async function connectRedis (): Promise<void> {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
  const enableRedis = process.env.ENABLE_REDIS !== 'false' // Default to true, set to 'false' to disable

  if (!enableRedis) {
    console.log(
      '⚠️  Redis is disabled (ENABLE_REDIS=false). Using in-memory storage.'
    )
    return
  }

  // Helper function to disconnect and clean up Redis clients
  const cleanupRedisClients = async () => {
    try {
      if (redisClient) {
        redisClient.removeAllListeners()
        await redisClient.quit().catch(() => {}) // Ignore errors during quit
        redisClient = null
      }
      if (redisPub) {
        redisPub.removeAllListeners()
        await redisPub.quit().catch(() => {})
        redisPub = null
      }
      if (redisSub) {
        redisSub.removeAllListeners()
        await redisSub.quit().catch(() => {})
        redisSub = null
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  // Helper function to set up error handlers that prevent unhandled errors
  const setupErrorHandlers = (client: Redis, name: string) => {
    client.on('error', err => {
      // Silently handle errors - we're using in-memory fallback
      redisEnabled = false
    })
    client.on('close', () => {
      redisEnabled = false
    })
  }

  try {
    // Main client for caching
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: null, // Disable automatic retries
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: () => null, // Never retry - stop immediately on failure
      connectTimeout: 5000,
      enableReadyCheck: false
    })
    setupErrorHandlers(redisClient, 'Client')

    // Publisher for Socket.io adapter
    redisPub = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: () => null,
      connectTimeout: 5000,
      enableReadyCheck: false
    })
    setupErrorHandlers(redisPub, 'Pub')

    // Subscriber for Socket.io adapter
    redisSub = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: () => null,
      connectTimeout: 5000,
      enableReadyCheck: false
    })
    setupErrorHandlers(redisSub, 'Sub')

    // Connect all clients with timeout
    const connectPromise = Promise.all([
      redisClient.connect(),
      redisPub.connect(),
      redisSub.connect()
    ])

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
    })

    await Promise.race([connectPromise, timeoutPromise])

    // Test connection
    await redisClient.ping()
    redisEnabled = true
    console.log('✅ Redis connected')
  } catch (error) {
    console.log('⚠️  Redis connection failed. Using in-memory storage.')
    console.log(
      '   To enable Redis, make sure Redis is running or set ENABLE_REDIS=false to suppress this message.'
    )
    redisEnabled = false
    // Clean up failed connections to prevent retry attempts
    await cleanupRedisClients()
    // Don't throw - allow server to continue with in-memory storage
  }
}

export function getRedisClient (): Redis | null {
  return redisEnabled ? redisClient : null
}

export function getRedisPub (): Redis | null {
  return redisEnabled ? redisPub : null
}

export function getRedisSub (): Redis | null {
  return redisEnabled ? redisSub : null
}

export function isRedisEnabled (): boolean {
  return redisEnabled
}

export async function disconnectRedis (): Promise<void> {
  if (redisClient) await redisClient.quit()
  if (redisPub) await redisPub.quit()
  if (redisSub) await redisSub.quit()
}

// Location cache helpers
export interface BusLocationCache {
  busId: string
  tripId: string
  routeId: string
  latitude: number
  longitude: number
  speed?: number
  heading?: number
  timestamp: number
}

// Clean up expired entries from memory store
function cleanupMemoryStore (): void {
  const now = Date.now()
  for (const [key, value] of memoryStore.entries()) {
    if (value.expiresAt && value.expiresAt < now) {
      memoryStore.delete(key)
    }
  }
}

// Run cleanup every 10 seconds
setInterval(cleanupMemoryStore, 10000)

export async function setBusLocation (
  busId: string,
  location: BusLocationCache
): Promise<void> {
  const key = `bus:${busId}:location`
  const expiresAt = Date.now() + LOCATION_TTL * 1000

  if (redisEnabled && redisClient) {
    try {
      await redisClient.setex(key, LOCATION_TTL, JSON.stringify(location))
      return
    } catch (error) {
      console.error(
        'Redis setBusLocation error, falling back to memory:',
        error
      )
      redisEnabled = false
    }
  }

  // In-memory fallback
  memoryStore.set(key, { data: location, expiresAt })
}

export async function getBusLocation (
  busId: string
): Promise<BusLocationCache | null> {
  const key = `bus:${busId}:location`

  if (redisEnabled && redisClient) {
    try {
      const data = await redisClient.get(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error(
        'Redis getBusLocation error, falling back to memory:',
        error
      )
      redisEnabled = false
    }
  }

  // In-memory fallback
  const stored = memoryStore.get(key)
  if (!stored) return null
  if (stored.expiresAt && stored.expiresAt < Date.now()) {
    memoryStore.delete(key)
    return null
  }
  return stored.data as BusLocationCache
}

export async function setActiveBus (
  busId: string,
  tripId: string
): Promise<void> {
  const key = `bus:${busId}:active`

  if (redisEnabled && redisClient) {
    try {
      await redisClient.set(key, tripId)
      return
    } catch (error) {
      console.error('Redis setActiveBus error, falling back to memory:', error)
      redisEnabled = false
    }
  }

  // In-memory fallback
  memoryStore.set(key, { data: tripId })
}

export async function getActiveBus (busId: string): Promise<string | null> {
  const key = `bus:${busId}:active`

  if (redisEnabled && redisClient) {
    try {
      return await redisClient.get(key)
    } catch (error) {
      console.error('Redis getActiveBus error, falling back to memory:', error)
      redisEnabled = false
    }
  }

  // In-memory fallback
  const stored = memoryStore.get(key)
  return stored ? (stored.data as string) : null
}

export async function removeActiveBus (busId: string): Promise<void> {
  const key = `bus:${busId}:active`
  const locationKey = `bus:${busId}:location`

  if (redisEnabled && redisClient) {
    try {
      await redisClient.del(key, locationKey)
      return
    } catch (error) {
      console.error(
        'Redis removeActiveBus error, falling back to memory:',
        error
      )
      redisEnabled = false
    }
  }

  // In-memory fallback
  memoryStore.delete(key)
  memoryStore.delete(locationKey)
}

export async function getAllActiveBusLocations (): Promise<BusLocationCache[]> {
  if (redisEnabled && redisClient) {
    try {
      const keys = await redisClient.keys('bus:*:location')
      if (keys.length === 0) return []

      const locations: BusLocationCache[] = []
      for (const key of keys) {
        const data = await redisClient.get(key)
        if (data) {
          locations.push(JSON.parse(data))
        }
      }
      return locations
    } catch (error) {
      console.error(
        'Redis getAllActiveBusLocations error, falling back to memory:',
        error
      )
      redisEnabled = false
    }
  }

  // In-memory fallback
  const locations: BusLocationCache[] = []
  const now = Date.now()
  for (const [key, value] of memoryStore.entries()) {
    if (key.startsWith('bus:') && key.endsWith(':location')) {
      if (value.expiresAt && value.expiresAt < now) {
        memoryStore.delete(key)
        continue
      }
      locations.push(value.data as BusLocationCache)
    }
  }
  return locations
}

export async function getActiveBusesOnRoute (
  routeId: string
): Promise<BusLocationCache[]> {
  const allLocations = await getAllActiveBusLocations()
  return allLocations.filter(loc => loc.routeId === routeId)
}
