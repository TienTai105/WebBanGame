import { Request, Response } from 'express'
import Notification from '../models/Notification'

// Get paginated notifications for user
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const pageNum = Number(page)
    const limitNum = Number(limit)
    const skip = (pageNum - 1) * limitNum

    const notifications = await Notification.find({ user: (req as any).user?._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean()

    const total = await Notification.countDocuments({ user: (req as any).user?._id })
    const unreadCount = await Notification.countDocuments({
      user: (req as any).user?._id,
      isRead: false,
    })

    res.status(200).json({
      success: true,
      data: {
        notifications,
        total,
        unreadCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

// Get unread notification count
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const unreadCount = await Notification.countDocuments({
      user: (req as any).user?._id,
      isRead: false,
    })

    res.status(200).json({
      success: true,
      data: {
        unreadCount,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching unread count',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

// Mark notification as read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    )

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      })
    }

    res.status(200).json({
      success: true,
      data: notification,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

// Mark all notifications as read
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const result = await Notification.updateMany(
      { user: (req as any).user?._id, isRead: false },
      { isRead: true }
    )

    res.status(200).json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
        message: `${result.modifiedCount} notifications marked as read`,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

// Delete notification
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params

    const notification = await Notification.findByIdAndDelete(notificationId)

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      })
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted',
      data: notification,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

// Delete all notifications for user
export const deleteAllNotifications = async (req: Request, res: Response) => {
  try {
    const result = await Notification.deleteMany({ user: (req as any).user?._id })

    res.status(200).json({
      success: true,
      data: {
        deletedCount: result.deletedCount,
        message: `${result.deletedCount} notifications deleted`,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting notifications',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

// Internal: Create notification (Called by other services)
export const createNotification = async (
  userId: string,
  type: string,
  title: string,
  message: string,
  data?: {
    link?: string
    icon?: string
    metadata?: any
  }
) => {
  try {
    const notification = new Notification({
      user: userId,
      type,
      title,
      message,
      link: data?.link,
      icon: data?.icon,
      metadata: data?.metadata,
    })

    return await notification.save()
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}
