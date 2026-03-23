import mongoose, { Schema, Document, Model } from 'mongoose'

interface IComment extends Document {
  newsId: mongoose.Types.ObjectId // Reference to News article
  userId?: mongoose.Types.ObjectId // Reference to User (if authenticated)
  name: string
  email: string
  content: string
  status: 'pending' | 'approved' | 'rejected' // For moderation
  ipAddress?: string
  userAgent?: string
  createdAt: Date
  updatedAt: Date
}

const commentSchema = new Schema<IComment>(
  {
    newsId: {
      type: Schema.Types.ObjectId,
      ref: 'News',
      required: [true, 'News ID is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters'],
      minlength: [2, 'Name must be at least 2 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
    },
    content: {
      type: String,
      required: [true, 'Please provide comment content'],
      maxlength: [2000, 'Comment cannot be more than 2000 characters'],
      minlength: [10, 'Comment must be at least 10 characters'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved', // You can change to 'pending' for moderation workflow
    },
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Index for better query performance
commentSchema.index({ newsId: 1, status: 1, createdAt: -1 })
commentSchema.index({ email: 1 })

// Static method to get comment count for a news article
commentSchema.statics.getCommentCount = async function (newsId: string) {
  const count = await this.countDocuments({ newsId, status: 'approved' })
  return count
}

const Comment: Model<IComment> = mongoose.model('Comment', commentSchema)

export default Comment
export type { IComment }
