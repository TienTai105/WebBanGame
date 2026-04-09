import mongoose from 'mongoose'

const tokenBlacklistSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    reason: {
      type: String,
      enum: ['logout', 'password_change', 'admin_revoke'],
      default: 'logout',
    },
  },
  {
    timestamps: true,
  }
)

// TTL index: Auto-delete expired tokens sau 1 giờ từ lúc expire
tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 })

const TokenBlacklist = mongoose.model('TokenBlacklist', tokenBlacklistSchema)

export default TokenBlacklist
