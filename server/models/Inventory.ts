import mongoose, { Schema, Document, Model } from 'mongoose'

interface IInventory extends Document {
  productId: mongoose.Types.ObjectId | string      // sản phẩm
  variantSku?: string                              // SKU của variant (nullable nếu product không có variants)
  available: number                                 // có sẵn bán
  reserved: number                                  // đang giữ tồn
  sold: number                                      // đã bán
  damaged: number                                   // hỏng mất
  lastUpdated: Date
  createdAt: Date
  updatedAt: Date
}

const inventorySchema = new Schema<IInventory>(
  {
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
    available: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    reserved: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    sold: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    damaged: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    lastUpdated: {
      type: Date,
      default: () => new Date(),
    },
  },
  { timestamps: true }
)

// Validation: Không cho stock âm
inventorySchema.pre<IInventory>('save', function (next) {
  const total = this.available + this.reserved + this.sold + this.damaged
  if (Object.values(this.toObject()).some(val => typeof val === 'number' && val < 0)) {
    next(new Error('Inventory quantities cannot be negative'))
  }
  next()
})

// Compound unique index: productId + variantSku
inventorySchema.index({ productId: 1, variantSku: 1 }, { unique: true, sparse: true })

// Single indexes for queries
inventorySchema.index({ productId: 1 })
inventorySchema.index({ available: 1 })
inventorySchema.index({ reserved: 1 })

const Inventory: Model<IInventory> = mongoose.model<IInventory>('Inventory', inventorySchema)
export default Inventory
export type { IInventory }
