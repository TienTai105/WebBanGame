import mongoose, { Schema, Document } from 'mongoose'

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

interface INotification extends Document {
  user: mongoose.Types.ObjectId
  type: NotificationType
  title: string
  message: string
  icon?: string
  link?: string  // For navigation
  isRead: boolean
  metadata?: {
    orderId?: string
    productId?: string
    reviewId?: string
    promotionId?: string
    [key: string]: any
  }
  createdAt: Date
  updatedAt: Date
}

const notificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide user'],
      index: true,
    },
    type: {
      type: String,
      enum: [
        'order_created',
        'order_updated',
        'order_completed',
        'order_cancelled',
        'review_pending',
        'review_approved',
        'review_rejected',
        'promotion',
        'contact_message',
        'inventory_low',
        'new_user',
        'admin_message',
      ],
      required: [true, 'Please provide notification type'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide title'],
    },
    message: {
      type: String,
      required: [true, 'Please provide message'],
    },
    icon: {
      type: String,
      default: null,
    },
    link: {
      type: String,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for efficient queries
notificationSchema.index({ user: 1, createdAt: -1 })
notificationSchema.index({ user: 1, isRead: 1 })
notificationSchema.index({ createdAt: -1 })

// Auto-delete notifications after 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 })

export default mongoose.model<INotification>('Notification', notificationSchema)
