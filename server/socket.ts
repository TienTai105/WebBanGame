import { Server as HttpServer } from 'http'
import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'

// Track online users: Map<userId, Set<socketId>>
const onlineUsers = new Map<string, Set<string>>()

let io: Server | null = null

export function getIO(): Server | null {
  return io
}

/** Get current online user IDs */
export function getOnlineUserIds(): string[] {
  return Array.from(onlineUsers.keys())
}

/** Get online user count */
export function getOnlineCount(): number {
  return onlineUsers.size
}

/** Check if a specific user is online */
export function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId)
}

/** Broadcast updated online list to all admin sockets */
function broadcastOnlineUsers() {
  if (!io) return
  const userIds = getOnlineUserIds()
  io.to('admin-room').emit('onlineUsers', { userIds, count: userIds.length })
}

/**
 * Emit notification to specific user(s)
 * If user is online, they'll receive it immediately via socket
 */
export function emitUserNotification(userId: string | string[], notification: any) {
  if (!io) {
    console.warn('Socket.IO not initialized')
    return
  }

  const userIds = Array.isArray(userId) ? userId : [userId]
  
  userIds.forEach(uid => {
    // Notify via socket if user is online
    io!.to(`user:${uid}`).emit('notification', notification)
  })
}

export function initSocket(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
      credentials: true,
    },
  })

  // Auth middleware: verify JWT before allowing connection
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) {
      return next(new Error('Authentication required'))
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any
      ;(socket as any).userId = decoded._id || decoded.userId
      ;(socket as any).userRole = decoded.role
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId as string
    const userRole = (socket as any).userRole as string

    if (!userId) return socket.disconnect()

    // Register user as online
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set())
    }
    onlineUsers.get(userId)!.add(socket.id)

    // Join admin room if admin/staff
    if (userRole === 'admin' || userRole === 'staff') {
      socket.join('admin-room')
    }

    // Join user notification room
    socket.join(`user:${userId}`)

    // Broadcast updated online list
    broadcastOnlineUsers()

    // Admin can request current online list
    socket.on('getOnlineUsers', () => {
      const userIds = getOnlineUserIds()
      socket.emit('onlineUsers', { userIds, count: userIds.length })
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      const sockets = onlineUsers.get(userId)
      if (sockets) {
        sockets.delete(socket.id)
        if (sockets.size === 0) {
          onlineUsers.delete(userId)
        }
      }
      broadcastOnlineUsers()
    })
  })

  console.log('  ✓ Socket.IO initialized')
  return io
}
