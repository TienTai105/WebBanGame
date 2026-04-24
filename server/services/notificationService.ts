import { createNotification } from '../controllers/notificationController.js'
import { emitUserNotification } from '../socket.js'
import User from '../models/User.js'

type NotificationType = 
  | 'order_created'
  | 'order_updated'
  | 'order_completed'
  | 'order_cancelled'
  | 'review_pending'
  | 'review_approved'
  | 'review_rejected'
  | 'promotion'
  | 'contact_message'
  | 'inventory_low'
  | 'new_user'
  | 'admin_message'

const getAdminAndStaffUsers = async () => {
  return User.find({ role: { $in: ['admin', 'staff'] } })
}

const broadcastToAdminAndStaff = async (
  type: NotificationType,
  title: string,
  message: string,
  link?: string,
  metadata?: any
) => {
  const admins = await getAdminAndStaffUsers()
  if (!admins || admins.length === 0) {
    console.warn('⚠️ [broadcastToAdminAndStaff] No admin/staff users found')
    return
  }

  const notifications = await Promise.all(
    admins.map(async (admin) => {
      const notification = await createNotification(admin._id.toString(), type, title, message, {
        link,
        metadata,
      })
      return notification
    })
  )

  notifications.forEach((notification) => {
    emitUserNotification(notification.user.toString(), {
      _id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    })
  })
}

/**
 * Create order notification for user
 */
export const notifyOrderCreated = async (userId: string, orderId: string) => {
  try {
    const notification = await createNotification(
      userId,
      'order_created',
      'Đơn hàng được tạo',
      'Đơn hàng của bạn đã được tạo thành công. Vui lòng kiểm tra chi tiết.',
      {
        link: `/order-history`,
        metadata: { orderId },
      }
    )

    // Emit real-time socket notification
    emitUserNotification(userId, {
      _id: notification._id,
      type: 'order_created',
      title: 'Đơn hàng được tạo',
      message: 'Đơn hàng của bạn đã được tạo thành công. Vui lòng kiểm tra chi tiết.',
      isRead: false,
      createdAt: notification.createdAt,
    })
  } catch (error) {
    console.error('Error notifying order created:', error)
  }
}

/**
 * Notify when order status is updated
 */
export const notifyOrderUpdated = async (userId: string, orderId: string, status: string) => {
  try {
    const statusMessages: { [key: string]: string } = {
      pending: 'Đơn hàng đang chờ xử lý',
      confirmed: 'Đơn hàng đã được xác nhận',
      processing: 'Đơn hàng đang được xử lý',
      shipped: 'Đơn hàng đã được gửi đi',
      delivered: 'Đơn hàng đã được giao',
      cancelled: 'Đơn hàng đã bị hủy',
      returned: 'Đơn hàng đã được trả lại',
    }

    const message = statusMessages[status] || `Trạng thái đơn hàng: ${status}`

    const notification = await createNotification(
      userId,
      'order_updated',
      'Cập nhật đơn hàng',
      message,
      {
        link: `/order-history`,
        metadata: { orderId, status },
      }
    )

    // Emit real-time socket notification
    emitUserNotification(userId, {
      _id: notification._id,
      type: 'order_updated',
      title: 'Cập nhật đơn hàng',
      message,
      isRead: false,
      createdAt: notification.createdAt,
    })
  } catch (error) {
    console.error('Error notifying order updated:', error)
  }
}

/**
 * Notify when order is completed
 */
export const notifyOrderCompleted = async (userId: string, orderId: string) => {
  try {
    const notification = await createNotification(
      userId,
      'order_completed',
      'Đơn hàng hoàn thành',
      'Đơn hàng của bạn đã hoàn thành. Bạn có thể để lại đánh giá!',
      {
        link: `/order-history`,
        metadata: { orderId },
      }
    )

    // Emit real-time socket notification
    emitUserNotification(userId, {
      _id: notification._id,
      type: 'order_completed',
      title: 'Đơn hàng hoàn thành',
      message: 'Đơn hàng của bạn đã hoàn thành. Bạn có thể để lại đánh giá!',
      isRead: false,
      createdAt: notification.createdAt,
    })
  } catch (error) {
    console.error('Error notifying order completed:', error)
  }
}

/**
 * Notify when order is cancelled
 */
export const notifyOrderCancelled = async (userId: string, orderId: string, reason?: string) => {
  try {
    await createNotification(
      userId,
      'order_cancelled',
      'Đơn hàng bị hủy',
      reason || 'Đơn hàng của bạn đã bị hủy.',
      {
        link: `/order-history`,
        metadata: { orderId, reason },
      }
    )
  } catch (error) {
    console.error('Error notifying order cancelled:', error)
  }
}

/**
 * Notify admin when new review is waiting for approval
 */
export const notifyAdminReviewPending = async (adminId: string, reviewId: string, productName: string) => {
  try {
    await broadcastToAdminAndStaff(
      'review_pending',
      'Đánh giá chờ phê duyệt',
      `Bài đánh giá cho "${productName}" chờ phê duyệt của bạn.`,
      `/admin/reviews?id=${reviewId}`,
      { reviewId, productName }
    )
  } catch (error) {
    console.error('Error notifying admin review pending:', error)
  }
}

/**
 * Notify user when review is approved
 */
export const notifyReviewApproved = async (userId: string, reviewId: string, productName: string) => {
  try {
    const notification = await createNotification(
      userId,
      'review_approved',
      'Đánh giá được phê duyệt',
      `Bài đánh giá của bạn cho "${productName}" đã được phê duyệt!`,
      {
        link: `/order-history`,
        metadata: { reviewId, productName },
      }
    )

    // Emit real-time socket notification
    emitUserNotification(userId, {
      _id: notification._id,
      type: 'review_approved',
      title: 'Đánh giá được phê duyệt',
      message: `Bài đánh giá của bạn cho "${productName}" đã được phê duyệt!`,
      isRead: false,
      createdAt: notification.createdAt,
    })
  } catch (error) {
    console.error('Error notifying review approved:', error)
  }
}

/**
 * Notify user when review is rejected
 */
export const notifyReviewRejected = async (userId: string, reviewId: string, productName: string, reason?: string) => {
  try {
    const notification = await createNotification(
      userId,
      'review_rejected',
      'Đánh giá bị từ chối',
      reason || `Bài đánh giá của bạn cho "${productName}" không được phê duyệt. Vui lòng kiểm tra lại.`,
      {
        link: `/order-history`,
        metadata: { reviewId, productName, reason },
      }
    )

    // Emit real-time socket notification
    emitUserNotification(userId, {
      _id: notification._id,
      type: 'review_rejected',
      title: 'Đánh giá bị từ chối',
      message: reason || `Bài đánh giá của bạn cho "${productName}" không được phê duyệt. Vui lòng kiểm tra lại.`,
      isRead: false,
      createdAt: notification.createdAt,
    })
  } catch (error) {
    console.error('Error notifying review rejected:', error)
  }
}

/**
 * Notify all users about promotion
 */
export const notifyPromotionCreated = async (promotionId: string, promotionTitle: string, link?: string) => {
  try {
    // This would typically be called by admin service
    // For now, we'll skip the actual implementation as it requires broadcasting
    console.log(`Promotion notification for: ${promotionTitle}`)
  } catch (error) {
    console.error('Error notifying promotion:', error)
  }
}

/**
 * Notify admin about low inventory
 */
export const notifyAdminInventoryLow = async (adminId: string, productName: string, quantity: number, threshold: number) => {
  try {
    await broadcastToAdminAndStaff(
      'inventory_low',
      'Cảnh báo tồn kho thấp',
      `"${productName}" có tồn kho chỉ ${quantity} (ngưỡng: ${threshold}).`,
      `/admin/inventory`,
      { productName, quantity, threshold }
    )
  } catch (error) {
    console.error('Error notifying admin inventory low:', error)
  }
}

/**
 * Notify admin when new user registers
 */
export const notifyAdminNewUser = async (adminId: string, userName: string, userEmail: string) => {
  try {
    await broadcastToAdminAndStaff(
      'new_user',
      'Người dùng mới đăng ký',
      `${userName} (${userEmail}) vừa đăng ký tài khoản.`,
      `/admin/users`,
      { userName, userEmail }
    )
  } catch (error) {
    console.error('Error notifying admin new user:', error)
  }
}

/**
 * Notify admin about new contact message
 */
export const notifyAdminContactMessage = async (adminId: string, senderName: string, subject: string) => {
  try {
    await broadcastToAdminAndStaff(
      'contact_message',
      'Tin nhắn liên hệ mới',
      `${senderName} đã gửi tin nhắn: "${subject}".`,
      `/admin/contacts`,
      { senderName, subject }
    )
  } catch (error) {
    console.error('Error notifying admin contact message:', error)
  }
}

/**
 * Send admin custom message
 */
export const notifyAdminMessage = async (adminId: string, title: string, message: string, link?: string, metadata?: any) => {
  try {
    await broadcastToAdminAndStaff('admin_message', title, message, link, metadata)
  } catch (error) {
    console.error('Error sending admin message:', error)
  }
}

/**
 * ✅ Notify all admins about new review pending approval
 */
export const notifyAdminNewReview = async (reviewId: string, productName: string, userName: string, rating: number) => {
  try {
    console.log('📢 [notifyAdminNewReview] Starting notification process:', { reviewId, productName, userName, rating })

    await broadcastToAdminAndStaff(
      'review_pending',
      'Đánh giá chờ phê duyệt',
      `${userName} đã viết đánh giá ${rating}⭐ cho "${productName}".`,
      `/admin/reviews?filter=pending`,
      { reviewId, productName, userName, rating }
    )

    console.log('✅ [notifyAdminNewReview] Broadcast notification sent to all admin/staff')
  } catch (error) {
    console.error('❌ Error notifying admins about new review:', error)
  }
}
