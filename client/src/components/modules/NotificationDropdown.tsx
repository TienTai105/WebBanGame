import { useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { useNotifications, useMarkAsRead, useDeleteNotification, useMarkAllAsRead } from '../../hooks/queries/useNotifications'
import { getNotificationIcon } from '../../utils/notificationUtils'

interface NotificationDropdownProps {
  onClose: () => void
}

const NotificationDropdown = ({ onClose }: NotificationDropdownProps) => {
  const navigate = useNavigate()
  const { data, isLoading, error } = useNotifications(1, 20)
  const markAsRead = useMarkAsRead()
  const deleteNotification = useDeleteNotification()
  const markAllAsRead = useMarkAllAsRead()

  const notifications = data?.notifications ?? []
  const unreadCount = notifications.filter((n) => !n.isRead).length

  // Handle notification click: mark as read + navigate if link exists
  const handleNotificationClick = (notification: typeof notifications[0]) => {
    // Mark as read
    if (!notification.isRead) {
      markAsRead.mutate(notification._id)
    }

    // Navigate if link exists
    if (notification.link) {
      navigate(notification.link, {
        state: { 
          scrollTo: notification.metadata?.scrollTo,
          highlightId: notification.metadata?.highlightId,
        },
      })
      onClose()
    }
  }

  const handleDeleteClick = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    deleteNotification.mutate(notificationId)
  }

  const handleMarkAllAsRead = () => {
    if (unreadCount > 0) {
      markAllAsRead.mutate()
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Thông báo
          {unreadCount > 0 && (
            <span className="ml-2 inline-block px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full">
              {unreadCount}
            </span>
          )}
        </h3>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Đánh dấu tất cả
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            Có lỗi khi tải thông báo
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            Không có thông báo nào
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              className={`flex items-start gap-3 p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-colors ${
                notification.isRead
                  ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750'
                  : 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40'
              }`}
            >
              {/* Icon */}
              <div className="flex-shrink-0 pt-1">
                {getNotificationIcon(notification.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${notification.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                  {notification.title}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {new Date(notification.createdAt).toLocaleDateString('vi-VN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
                <button
                  onClick={(e) => handleDeleteClick(e, notification._id)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                  aria-label="Delete notification"
                >
                  <Trash2 size={16} className="text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-4 text-center border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
          <a
            href="/notification-history"
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Xem tất cả thông báo
          </a>
        </div>
      )}
    </div>
  )
}

export default NotificationDropdown
