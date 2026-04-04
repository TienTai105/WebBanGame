import React from 'react'
import { Package, AlertCircle, MessageSquare, Star, Gift, Users, PhoneCall, TrendingUp } from 'lucide-react'
import { NotificationType } from '../services/index'

/**
 * Get appropriate icon for notification type
 */
export const getNotificationIcon = (type: NotificationType): React.ReactNode => {
  const iconProps = { size: 20 }
  
  switch (type) {
    case 'order_created':
      return React.createElement(Package, { ...iconProps, className: 'text-blue-600 dark:text-blue-400' })
    case 'order_updated':
      return React.createElement(Package, { ...iconProps, className: 'text-orange-600 dark:text-orange-400' })
    case 'order_completed':
      return React.createElement(Package, { ...iconProps, className: 'text-green-600 dark:text-green-400' })
    case 'order_cancelled':
      return React.createElement(Package, { ...iconProps, className: 'text-red-600 dark:text-red-400' })
    case 'review_pending':
      return React.createElement(MessageSquare, { ...iconProps, className: 'text-yellow-600 dark:text-yellow-400' })
    case 'review_approved':
      return React.createElement(Star, { ...iconProps, className: 'text-green-600 dark:text-green-400' })
    case 'review_rejected':
      return React.createElement(AlertCircle, { ...iconProps, className: 'text-red-600 dark:text-red-400' })
    case 'promotion':
      return React.createElement(Gift, { ...iconProps, className: 'text-pink-600 dark:text-pink-400' })
    case 'contact_message':
      return React.createElement(PhoneCall, { ...iconProps, className: 'text-cyan-600 dark:text-cyan-400' })
    case 'inventory_low':
      return React.createElement(AlertCircle, { ...iconProps, className: 'text-orange-600 dark:text-orange-400' })
    case 'new_user':
      return React.createElement(Users, { ...iconProps, className: 'text-purple-600 dark:text-purple-400' })
    case 'admin_message':
      return React.createElement(TrendingUp, { ...iconProps, className: 'text-indigo-600 dark:text-indigo-400' })
    default:
      return React.createElement(Package, { ...iconProps, className: 'text-gray-600 dark:text-gray-400' })
  }
}

/**
 * Get user-friendly label for notification type
 */
export const getNotificationTypeLabel = (type: NotificationType): string => {
  const labels: Record<NotificationType, string> = {
    order_created: 'Đơn hàng mới',
    order_updated: 'Cập nhật đơn hàng',
    order_completed: 'Đơn hàng hoàn thành',
    order_cancelled: 'Đơn hàng bị hủy',
    review_pending: 'Bài đánh giá chờ duyệt',
    review_approved: 'Bài đánh giá được phê duyệt',
    review_rejected: 'Bài đánh giá bị từ chối',
    promotion: 'Khuyến mãi mới',
    contact_message: 'Tin nhắn liên hệ',
    inventory_low: 'Cảnh báo tồn kho',
    new_user: 'Người dùng mới',
    admin_message: 'Tin nhắn từ quản trị',
  }
  return labels[type] || 'Thông báo'
}

/**
 * Get notification link/route based on type and metadata
 */
export const getNotificationLink = (type: NotificationType, metadata?: Record<string, any>): string => {
  switch (type) {
    case 'order_created':
    case 'order_updated':
    case 'order_completed':
    case 'order_cancelled':
      return `/order-history${metadata?.orderId ? `#${metadata.orderId}` : ''}`
    case 'review_pending':
    case 'review_approved':
    case 'review_rejected':
      return `/admin/reviews${metadata?.reviewId ? `?id=${metadata.reviewId}` : ''}`
    case 'promotion':
      return `/promotions${metadata?.promotionId ? `#${metadata.promotionId}` : ''}`
    case 'contact_message':
      return `/admin/contacts`
    case 'inventory_low':
      return `/admin/inventory`
    case 'new_user':
      return `/admin/users`
    case 'admin_message':
      return `/admin/messages`
    default:
      return `/`
  }
}

