import mongoose, { Schema, Document, Model } from 'mongoose'

interface IAuditLog extends Document {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'EXPORT' | 'IMPORT' | 'LOGIN'
  entity: 'Product' | 'Order' | 'Inventory' | 'User' | 'Promotion' | 'Shipment' | 'News' | 'Review' | 'Comment' | 'Contact'
  entityId: mongoose.Types.ObjectId | string
  oldValue?: any                                    // toàn bộ document cũ
  newValue?: any                                    // toàn bộ document mới
  changes?: Record<string, { old: any; new: any }> // chỉ những field thay đổi
  userId: mongoose.Types.ObjectId                  // ai làm hành động
  userEmail?: string                               // email của user (denormalize)
  ipAddress?: string
  userAgent?: string
  reason?: string                                   // lý do thay đổi (nếu có)
  status?: 'success' | 'failed'
  errorMessage?: string
  createdAt: Date
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      enum: ['CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'EXPORT', 'IMPORT', 'LOGIN'],
      required: [true, 'Action required'],
      index: true,
    },
    entity: {
      type: String,
      enum: ['Product', 'Order', 'Inventory', 'User', 'Promotion', 'Shipment', 'News', 'Review', 'Comment', 'Contact'],
      required: [true, 'Entity required'],
      index: true,
    },
    entityId: {
      type: Schema.Types.Mixed,
      required: [true, 'Entity ID required'],
      index: true,
    },
    oldValue: {
      type: Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: Schema.Types.Mixed,
      default: null,
    },
    changes: {
      type: Schema.Types.Mixed,
      default: null,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID required'],
      index: true,
    },
    userEmail: String,
    ipAddress: String,
    userAgent: String,
    reason: String,
    status: {
      type: String,
      enum: ['success', 'failed'],
      default: 'success',
    },
    errorMessage: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

// Index for querying
auditLogSchema.index({ action: 1, createdAt: -1 })
auditLogSchema.index({ entity: 1, entityId: 1, createdAt: -1 })
auditLogSchema.index({ userId: 1, createdAt: -1 })
auditLogSchema.index({ createdAt: -1 })

const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>('AuditLog', auditLogSchema)
export default AuditLog
export type { IAuditLog }
