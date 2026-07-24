import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

// 🎯 Lấy URL Backend từ VITE_API_URL trong .env của bạn
// Ví dụ: "http://localhost:5000/api" -> cắt bỏ "/api" -> còn "http://localhost:5000"
const SOCKET_URL = 
  import.meta.env.VITE_SOCKET_URL || 
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 
  'https://webbangame.onrender.com'

export function connectSocket(token: string): Socket {
  if (socket?.connected) {
    if (socket.auth && (socket.auth as { token: string }).token !== token) {
      socket.auth = { token }
    }
    return socket
  }

  if (socket) {
    socket.auth = { token }
    socket.connect()
    return socket
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['polling', 'websocket'],
    withCredentials: true,
  })

  socket.on('connect', () => {
    console.log('🔌 Socket connected successfully to:', SOCKET_URL, '| ID:', socket?.id)
    window.dispatchEvent(new Event('socket-connected'))
  })

  socket.on('connect_error', (err) => {
    console.error('🔌 Socket connection error:', err.message)
  })

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason)
  })

  return socket
}

export function getSocket(): Socket | null {
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}