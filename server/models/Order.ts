import mongoose, { Schema, Document, Model } from 'mongoose'

interface IOrderItem {
  product: mongoose.Types.ObjectId
  variantSku?: string                           // Snapshot: variant SKU
  variant?: string                              // Snapshot: variant name (ASIAN, USA, EURO)
  warranty?: string                             // Snapshot: warranty (3 Tháng, 12 Tháng)
  quantity: number
  name: string                                  // Snapshot: product name at purchase
  image?: string                                // Snapshot: product image URL
  priceAtPurchase: number                       // Snapshot: price when ordered
  price: number                                 // Legacy: keeping for backward compat
}

interface IShippingAddress {
  name: string
  address: string
  city: string
  phone: string
  ward?: string
  district?: string
  email?: string
}

interface IOrderStatusHistory {
  oldStatus?: string
  newStatus: string
  reason?: string
  changedBy: mongoose.Types.ObjectId | string  // userId or 'system'
  timestamp: Date
}

interface IOrder extends Document {
  user: mongoose.Types.ObjectId
  orderCode: string
  orderItems: IOrderItem[]
  totalPrice: number
  discountCode?: string
  discountAmount: number
  shippingFee: number
  finalPrice: number
  paymentMethod: string
  paymentStatus: 'unpaid' | 'paid'
  orderStatus: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled' | 'failed' | 'refunded'
  shippingAddress: IShippingAddress
  trackingNumber?: string
  reservedAt?: Date
  reservationExpiresAt?: Date
  holdId?: string
  momoRequestId?: string
  momoTransactionId?: string
  stockConfirmedAt?: Date          // Track when stock was confirmed (prevent double-confirm)
  statusHistory?: IOrderStatusHistory[]
  createdAt: Date
  updatedAt: Date
}

const orderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide user'],
    },
    orderCode: {
      type: String,
      required: true,
      unique: true,
    },
    orderItems: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        variantSku: {
          type: String,
          default: null,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        name: {
          type: String,
          required: true,  // Snapshot: product name at time of order
        },
        image: {
          type: String,
          default: null,  // Snapshot: product main image URL
        },
        priceAtPurchase: {
          type: Number,
          required: true,  // Snapshot: actual price charged
          min: 0,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        variant: {
          type: String,
          default: null,
        },
        warranty: {
          type: String,
          default: null,
        },
      },
    ],
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discountCode: String,
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    shippingFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      required: [true, 'Please provide payment method'],
      enum: ['COD', 'VNPay', 'Momo', 'Stripe'],
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid'],
      default: 'unpaid',
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'completed', 'cancelled', 'failed', 'refunded'],
      default: 'pending',
    },
    shippingAddress: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      phone: { type: String, required: true },
      ward: { type: String },
      district: { type: String },
      email: { type: String },
    },
    trackingNumber: String,
    reservedAt: Date,
    reservationExpiresAt: Date,
    holdId: String,
    momoRequestId: String,
    momoTransactionId: String,
    stockConfirmedAt: {
      type: Date,
      default: null,
    },
    statusHistory: [
      {
        oldStatus: String,
        newStatus: String,
        reason: String,
        changedBy: Schema.Types.Mixed,  // userId or 'system'
        timestamp: {
          type: Date,
          default: () => new Date(),
        },
        _id: false,
      },
    ],
  },
  { timestamps: true }
)

// Create indexes
orderSchema.index({ user: 1, createdAt: -1 })
orderSchema.index({ orderCode: 1 })
orderSchema.index({ orderStatus: 1 })
orderSchema.index({ paymentStatus: 1 })

const Order: Model<IOrder> = mongoose.model<IOrder>('Order', orderSchema)
export default Order
export type { IOrder, IOrderItem, IShippingAddress, IOrderStatusHistory }
