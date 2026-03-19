import mongoose, { Schema, Document, Model } from 'mongoose'

interface IGenre extends Document {
  name: string
  slug: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

const genreSchema = new Schema<IGenre>(
  {
    name: {
      type: String,
      required: [true, 'Please provide genre name'],
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
  },
  { timestamps: true }
)

// Create indexes
genreSchema.index({ slug: 1 })
genreSchema.index({ name: 1 })

const Genre: Model<IGenre> = mongoose.model<IGenre>('Genre', genreSchema)
export default Genre
export type { IGenre }
