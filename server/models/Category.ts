import mongoose, { Schema, Document, Model } from 'mongoose'

interface ICategory extends Document {
  name: string
  slug: string
  parentId: mongoose.Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name required'],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug required'],
      lowercase: true,
      unique: true,
      trim: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
  },
  { timestamps: true }
)

// Create indexes
categorySchema.index({ slug: 1 })
categorySchema.index({ parentId: 1 })

const Category: Model<ICategory> = mongoose.model<ICategory>('Category', categorySchema)
export default Category
export type { ICategory }
