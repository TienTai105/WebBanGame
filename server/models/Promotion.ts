import mongoose, { Schema, Document, Model } from 'mongoose'

interface IPromotion extends Document {
  code: string                                      // SAVE20, WHITEMONDAY
  type: 'percentage' | 'fixed'                     // -20% hoặc -50k
  value: number                                    // 20 (percentage) hoặc 50000 (fixed)
  maxDiscount?: number                             // tối đa giảm 500k
  minOrderValue?: number                           // order >= 1M mới áp dụng
  applicableProducts?: mongoose.Types.ObjectId[]   // specific products
  applicableCategories?: mongoose.Types.ObjectId[]
  applicableBrands?: mongoose.Types.ObjectId[]
  excludeProducts?: mongoose.Types.ObjectId[]      // không áp dụng cho sản phẩm này
  usageLimit: number                               // tối đa dùng 100 lần
  usedCount: number                                // đã dùng bao nhiêu lần
  usagePerUser?: number                            // 1 user dùng tối đa 1 lần
  usedByUsers?: mongoose.Types.ObjectId[]          // users đã dùng
  startDate: Date
  endDate: Date
  isActive: boolean
  description?: string
  createdAt: Date
  updatedAt: Date
}

const promotionSchema = new Schema<IPromotion>(
  {
    code: {
      type: String,
      required: [true, 'Promotion code required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      index: true,
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: [true, 'Promotion type required'],
    },
    value: {
      type: Number,
      required: [true, 'Promotion value required'],
      min: 0,
    },
    maxDiscount: {
      type: Number,
      min: 0,
      default: null,
    },
    minOrderValue: {
      type: Number,
      min: 0,
      default: 0,
    },
    applicableProducts: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    applicableCategories: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    applicableBrands: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Brand',
      },
    ],
    excludeProducts: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    usageLimit: {
      type: Number,
      required: true,
      default: 999999,
      min: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    usagePerUser: {
      type: Number,
      default: 1,                                   // mỗi user dùng 1 lần
      min: 1,
    },
    usedByUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    startDate: {
      type: Date,
      required: [true, 'Start date required'],
      index: true,
    },
    endDate: {
      type: Date,
      required: [true, 'End date required'],
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    description: String,
  },
  { timestamps: true }
)

// Validation: end date > start date
promotionSchema.pre<IPromotion>('save', function (next) {
  if (this.endDate <= this.startDate) {
    next(new Error('End date must be after start date'))
  }
  if (this.type === 'percentage' && this.value > 100) {
    next(new Error('Percentage discount cannot exceed 100%'))
  }
  next()
})

// Index
promotionSchema.index({ code: 1 })
promotionSchema.index({ isActive: 1, startDate: 1, endDate: 1 })
promotionSchema.index({ 'applicableProducts._id': 1 })
promotionSchema.index({ 'applicableCategories._id': 1 })

const Promotion: Model<IPromotion> = mongoose.model<IPromotion>('Promotion', promotionSchema)
export default Promotion
export type { IPromotion }
