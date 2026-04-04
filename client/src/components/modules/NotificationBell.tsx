import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useUnreadCount } from '../../hooks/queries/useNotifications'
import { getSocket } from '../../utils/socket'
import NotificationDropdown from '../modules/NotificationDropdown'

const NotificationBell = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { data: unreadCount = 0, isLoading } = useUnreadCount()
  const queryClient = useQueryClient()

  // Listen for real-time notifications via Socket.IO
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleNotification = (notification: any) => {
      console.log('📢 Received notification via socket:', notification)
      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }

    socket.on('notification', handleNotification)

    return () => {
      socket.off('notification', handleNotification)
    }
  }, [queryClient])

  const handleBellClick = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={handleBellClick}
        className="relative inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={22} className="text-gray-700 dark:text-gray-300" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {isLoading && (
          <span className="absolute top-0 right-0 w-5 h-5 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
        )}
      </button>

      {/* Dropdown */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 z-50">
          <NotificationDropdown onClose={() => setIsDropdownOpen(false)} />
        </div>
      )}
    </div>
  )
}

export default NotificationBell
