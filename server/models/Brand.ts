import mongoose, { Schema, Document, Model } from 'mongoose'

interface IBrand extends Document {
  name: string
  slug: string
  logo?: string
  description?: string
  website?: string
  createdAt: Date
  updatedAt: Date
}

const brandSchema = new Schema<IBrand>(
  {
    name: {
      type: String,
      required: [true, 'Please provide brand name'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    logo: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: '',
    },
    website: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
)

// Create indexes
brandSchema.index({ slug: 1 })
brandSchema.index({ name: 1 })

const Brand: Model<IBrand> = mongoose.model<IBrand>('Brand', brandSchema)
export default Brand
export type { IBrand }
