import mongoose, { Schema, Document, Model } from 'mongoose'

interface IPlatform extends Document {
  name: string
  slug: string
  description: string
  logo?: string
  createdAt: Date
  updatedAt: Date
}

const platformSchema = new Schema<IPlatform>(
  {
    name: {
      type: String,
      required: [true, 'Please provide platform name'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: '',
    },
    logo: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
)

// Create indexes
platformSchema.index({ slug: 1 })
platformSchema.index({ name: 1 })

const Platform: Model<IPlatform> = mongoose.model<IPlatform>('Platform', platformSchema)
export default Platform
export type { IPlatform }
