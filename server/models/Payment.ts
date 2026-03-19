import mongoose, { Schema, Document, Model } from 'mongoose'

interface IPayment extends Document {
  order: mongoose.Types.ObjectId
  user: mongoose.Types.ObjectId
  paymentMethod: string
  transactionId: string
  amount: number
  status: 'pending' | 'success' | 'failed'
  responseData?: Record<string, any>
  paidAt?: Date
  createdAt: Date
  updatedAt: Date
}

const paymentSchema = new Schema<IPayment>(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Please provide order'],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide user'],
    },
    paymentMethod: {
      type: String,
      required: [true, 'Please provide payment method'],
      enum: ['COD', 'VNPay', 'Momo', 'Stripe'],
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
    },
    responseData: Schema.Types.Mixed,
    paidAt: Date,
  },
  { timestamps: true }
)

// Create indexes
paymentSchema.index({ order: 1 })
paymentSchema.index({ user: 1 })
paymentSchema.index({ status: 1 })
paymentSchema.index({ transactionId: 1 })

const Payment: Model<IPayment> = mongoose.model<IPayment>('Payment', paymentSchema)
export default Payment
export type { IPayment }
