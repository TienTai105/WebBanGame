import mongoose, { Schema, Document, Model } from 'mongoose'

interface IProductVariant {
  sku: string
  name: string
  attributes?: Record<string, any>  // color, size, version, platform, edition, etc.
  images?: Array<{
    url: string
    cloudinaryId?: string
    alt?: string
    isMain?: boolean
  }>
  price: number
  cost: number
  discount: number
  finalPrice: number
  stock?: number  // Available quantity for this variant
  status: 'active' | 'inactive' | 'discontinued'
}

interface IProduct extends Document {
  name: string
  slug: string
  description: string
  sku: string
  categoryId: mongoose.Types.ObjectId  // Reference to Category (flat)
  price?: number  // Fallback price if no variants
  stock?: number  // Stock for products without variants
  cost?: number  // Cost price for profit calculation
  discount?: number  // Discount percentage (0-100)
  finalPrice?: number  // Price after discount (auto-calculated)
  minPrice: number  // Min price across all variants
  maxPrice: number  // Max price across all variants
  variants?: IProductVariant[]  // Embedded variants
  images?: Array<{
    url: string
    cloudinaryId?: string
    alt?: string
    isMain?: boolean
  }>
  specifications?: Record<string, any>
  tags?: string[]
  videoTrailerUrl?: string  // YouTube video URL (optional)
  // Multiplayer info (cho Game)
  multiplayer?: {
    isMultiplayer: boolean
    minPlayers?: number
    maxPlayers?: number
    modes?: string[]  // ['Co-op', 'PvP', 'Battle Royale']
  }
  // Brand & classifications
  brand?: mongoose.Types.ObjectId
  platforms?: mongoose.Types.ObjectId[]  // ref Platforms
  genres?: mongoose.Types.ObjectId[]     // ref Genres (for games)
  // Metrics
  ratingAverage?: number
  ratingCount?: number
  soldCount?: number
  // Status
  isActive: boolean
  isBaseProduct?: boolean  // Mark base product for seeding
  views: number
  createdAt: Date
  updatedAt: Date
}

const variantSchema = new Schema<IProductVariant>(
  {
    sku: {
      type: String,
      required: [true, 'Variant SKU required'],
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      default: '',
    },
    attributes: Schema.Types.Mixed,
    images: [
      {
        url: String,
        cloudinaryId: String,
        alt: String,
        isMain: { type: Boolean, default: false },
      },
    ],
    price: {
      type: Number,
      required: [true, 'Variant price required'],
      min: 0,
    },
    cost: {
      type: Number,
      min: 0,
      default: 0,
    },
    discount: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    finalPrice: {
      type: Number,
      default: function () {
        return this.price - (this.price * this.discount) / 100
      },
    },

    status: {
      type: String,
      enum: ['active', 'inactive', 'discontinued'],
      default: 'active',
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
)

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Please provide product name'],
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
      unique: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide product description'],
    },
    sku: {
      type: String,
      required: true,
      unique: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Please provide category'],
    },
    price: {
      type: Number,
      min: 0,  // Fallback price for products without variants
    },
    stock: {
      type: Number,
      min: 0,
      default: 0,
    },
    cost: {
      type: Number,
      min: 0,
      default: 0,  // Cost price for profit calculation
    },
    discount: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,  // Discount percentage
    },
    finalPrice: {
      type: Number,
      min: 0,  // Final price after discount (auto-calculated)
    },
    minPrice: {
      type: Number,
      min: 0,
      default: 0,  // Will be calculated from variants in pre-save hook
    },
    maxPrice: {
      type: Number,
      min: 0,
      default: 0,  // Will be calculated from variants in pre-save hook
    },
    variants: [variantSchema],
    images: [
      {
        url: String,
        cloudinaryId: String,
        alt: String,
        isMain: { type: Boolean, default: false },
      },
    ],
    specifications: Schema.Types.Mixed,
    tags: [String],
    videoTrailerUrl: {
      type: String,
      trim: true,
    },
    brand: {
      type: Schema.Types.ObjectId,
      ref: 'Brand',
    },
    platforms: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Platform',
      },
    ],
    genres: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Genre',
      },
    ],
    multiplayer: {
      isMultiplayer: {
        type: Boolean,
        default: false,
      },
      minPlayers: {
        type: Number,
        min: 1,
      },
      maxPlayers: {
        type: Number,
        min: 1,
      },
      modes: [String],  // Co-op, PvP, Battle Royale...
    },
    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    soldCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isBaseProduct: {
      type: Boolean,
      default: false,  // Only mark as true for original products used in seeding
      index: true,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
)

// Pre-save hook: Auto-calculate minPrice, maxPrice, and finalPrice from variants or fallback price
productSchema.pre<IProduct>('save', function (next) {
  if (this.variants && this.variants.length > 0) {
    const prices = this.variants.map(v => v.finalPrice)
    this.minPrice = Math.min(...prices)
    this.maxPrice = Math.max(...prices)
  } else if (this.price) {
    // If no variants, use fallback price for both min and max
    this.minPrice = this.price
    this.maxPrice = this.price
    // Calculate finalPrice from price and discount
    this.finalPrice = this.price - (this.price * (this.discount || 0)) / 100
  }
  next()
})

// Create indexes
productSchema.index({ categoryId: 1, createdAt: -1 })
productSchema.index({ categoryId: 1, soldCount: -1 })
productSchema.index({ sku: 1 })
productSchema.index({ slug: 1 })
productSchema.index({ tags: 1 })
productSchema.index({ brand: 1 })
productSchema.index({ platforms: 1 })
productSchema.index({ genres: 1 })

const Product: Model<IProduct> = mongoose.model<IProduct>('Product', productSchema)
export default Product
export type { IProduct, IProductVariant }
