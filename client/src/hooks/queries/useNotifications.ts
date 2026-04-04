import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query'
import { notificationService, NotificationsListResponse } from '../../services/index'

// Hook for getting user notifications
export const useNotifications = (
  page: number = 1,
  limit: number = 20
): UseQueryResult<NotificationsListResponse> => {
  return useQuery({
    queryKey: ['notifications', page, limit],
    queryFn: () =>
      notificationService
        .getNotifications(page, limit)
        .then((res) => res.data.data),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every 60 seconds
  })
}

// Hook for unread count
export const useUnreadCount = () => {
  return useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () =>
      notificationService
        .getUnreadCount()
        .then((res) => res.data.data.unreadCount),
    staleTime: 15 * 1000, // 15 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  })
}

// Hook for marking notification as read
export const useMarkAsRead = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })
}

// Hook for marking all as read
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: () =>
      notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })
}

// Hook for deleting notification
export const useDeleteNotification = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationService.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

// Utility hook to filter notifications by role
export const useNotificationsByRole = (role: 'user' | 'admin' = 'user') => {
  const { data, ...rest } = useNotifications(1, 20)

  // Filter notifications based on type and role
  const filtered = data?.notifications?.filter((notif) => {
    if (role === 'admin') {
      // Admin sees: order, review, contact, inventory, new_user
      return ['order_created', 'order_updated', 'review_pending', 'contact_message', 'inventory_low', 'new_user', 'admin_message'].includes(notif.type)
    }
    // User sees: order, review, promotion, admin_message
    return ['order_created', 'order_updated', 'order_completed', 'review_approved', 'review_rejected', 'promotion', 'admin_message'].includes(notif.type)
  }) ?? []

  return {
    ...rest,
    data: {
      ...data,
      notifications: filtered,
      total: filtered.length,
    },
  }
}
