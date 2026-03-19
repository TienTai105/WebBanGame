import mongoose, { Schema, Document, Model } from 'mongoose'

interface IStockMovement extends Document {
  inventoryId: mongoose.Types.ObjectId
  productId: mongoose.Types.ObjectId                // redundant lưu nhưng dễ query
  variantSku?: string                              // Track variant-specific movements
  type: 'IN' | 'OUT' | 'ADJUST' | 'RESERVED' | 'UNRESERVED'
  quantity: number
  reason?: string
  reference?: {
    type: 'Order' | 'ImportBill' | 'Adjustment' | 'Manual'
    id: mongoose.Types.ObjectId | string
  }
  notes?: string
  createdBy?: mongoose.Types.ObjectId               // user ID (admin)
  createdAt: Date
  updatedAt: Date
}

const stockMovementSchema = new Schema<IStockMovement>(
  {
    inventoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Inventory',
      required: [true, 'Inventory ID required'],
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID required'],
      index: true,
    },
    variantSku: {
      type: String,
      default: null,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['IN', 'OUT', 'ADJUST', 'RESERVED', 'UNRESERVED'],
      required: [true, 'Stock movement type required'],
      index: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity required'],
    },
    reason: {
      type: String,
      default: null,
    },
    reference: {
      type: {
        type: String,
        enum: ['Order', 'ImportBill', 'Adjustment', 'Manual'],
        default: 'Manual',
      },
      id: Schema.Types.Mixed,
    },
    notes: String,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
)

// Indexes
stockMovementSchema.index({ inventoryId: 1, createdAt: -1 })
stockMovementSchema.index({ productId: 1, createdAt: -1 })
stockMovementSchema.index({ type: 1, createdAt: -1 })
stockMovementSchema.index({ 'reference.id': 1 })

const StockMovement: Model<IStockMovement> = mongoose.model<IStockMovement>(
  'StockMovement',
  stockMovementSchema
)
export default StockMovement
export type { IStockMovement }
