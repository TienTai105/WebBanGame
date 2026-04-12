import express, { Router } from 'express'
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from '../controllers/notificationController.js'
import { protect } from '../middleware/auth.js'

const router: Router = express.Router()

// All routes require authentication
router.use(protect)

// Get paginated notifications
router.get('/', getNotifications)

// Get unread count
router.get('/unread-count', getUnreadCount)

// Mark notification as read
router.put('/:notificationId/read', markAsRead)

// Mark all as read
router.put('/read-all', markAllAsRead)

// Delete notification
router.delete('/:notificationId', deleteNotification)

// Delete all notifications
router.delete('/', deleteAllNotifications)

export default router
