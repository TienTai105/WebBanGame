import mongoose, { Schema, Document, Model } from 'mongoose'

interface IReview extends Document {
  user: mongoose.Types.ObjectId
  product: mongoose.Types.ObjectId
  rating: number
  title?: string
  comment?: string
  images?: string[]
  helpful?: {
    yes: number
    no: number
  }
  isApproved: boolean  // Admin must approve before showing on product page
  createdAt: Date
  updatedAt: Date
}

const reviewSchema = new Schema<IReview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide user'],
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Please provide product'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'Please provide rating'],
    },
    title: {
      type: String,
      default: '',
    },
    comment: {
      type: String,
      default: '',
    },
    images: [String],
    helpful: {
      yes: { type: Number, default: 0 },
      no: { type: Number, default: 0 },
    },
    isApproved: {
      type: Boolean,
      default: false,  // Must be approved by admin
      index: true,
    },
  },
  { timestamps: true }
)

// Create indexes
reviewSchema.index({ product: 1, isApproved: 1, createdAt: -1 })  // Show approved reviews
reviewSchema.index({ user: 1 })
reviewSchema.index({ rating: 1 })
reviewSchema.index({ isApproved: 1, createdAt: -1 })  // Admin finds pending reviews

const Review: Model<IReview> = mongoose.model<IReview>('Review', reviewSchema)
export default Review
export type { IReview }
