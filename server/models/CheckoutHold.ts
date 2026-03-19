import mongoose, { Schema, Document, Model } from 'mongoose'

interface ICheckoutHoldItem {
  productId: mongoose.Types.ObjectId | string
  variantSku?: string | null
  quantity: number
}

interface ICheckoutHold extends Document {
  holdId: string
  userId: mongoose.Types.ObjectId
  items: ICheckoutHoldItem[]
  reservedUntil: Date
  released: boolean
  createdAt: Date
  updatedAt: Date
}

const checkoutHoldSchema = new Schema<ICheckoutHold>(
  {
    holdId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: [
      {
        productId: { type: Schema.Types.Mixed, required: true },
        variantSku: { type: String, default: null },
        quantity: { type: Number, required: true },
      },
    ],
    reservedUntil: {
      type: Date,
      required: true,
      index: true,
    },
    released: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

// Auto-delete documents 1 hour after reservedUntil (cleanup)
checkoutHoldSchema.index({ reservedUntil: 1 }, { expireAfterSeconds: 3600 })

const CheckoutHold: Model<ICheckoutHold> = mongoose.model<ICheckoutHold>('CheckoutHold', checkoutHoldSchema)
export default CheckoutHold
export type { ICheckoutHold }
