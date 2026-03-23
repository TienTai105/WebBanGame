import mongoose, { Schema, Document, Model } from 'mongoose'

interface INews extends Document {
  title: string
  slug: string
  content: string // Rich HTML content (tương thích cũ)
  blocks?: Array<{
    type: 'heading' | 'paragraph' | 'image' | 'list' | 'quote' | 'divider' | 'video' | 'code'
    level?: number // For heading: 1-6
    text?: string // For heading, paragraph, quote
    items?: string[] // For list
    url?: string // For image, video
    alt?: string // For image
    language?: string // For code
    code?: string // For code block
    caption?: string // For image, video
  }>
  excerpt: string
  featuredImage?: {
    url: string
    cloudinaryId?: string
    alt?: string
  }
  author: mongoose.Types.ObjectId // Reference to User
  category: string // 'News', 'Review', 'Guide', 'Tutorial', etc.
  tags?: string[]
  featured: boolean // Show on homepage
  status: 'draft' | 'published' | 'archived'
  publishedAt?: Date
  // SEO
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string[]
  // Metrics
  views: number
  readTime: number // Estimated read time in minutes
  createdAt: Date
  updatedAt: Date
}

const newsSchema = new Schema<INews>(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Please provide content'],
      set: function(value: string) {
        // Remove leading whitespace from HTML content for proper rendering
        if (value) {
          return value
            .split('\n')
            .map(line => line.trim())
            .join('')
            .replace(/></g, '>\n<')
        }
        return value
      }
    },
    excerpt: {
      type: String,
      required: [true, 'Please provide an excerpt'],
      maxlength: [500, 'Excerpt cannot be more than 500 characters'],
    },
    featuredImage: {
      url: String,
      cloudinaryId: String,
      alt: String,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: ['News', 'Review', 'Guide', 'Tutorial', 'Interview', 'Opinion', 'Video'],
      default: 'News',
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    featured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    // SEO
    seoTitle: {
      type: String,
      maxlength: [60, 'SEO title cannot be more than 60 characters'],
    },
    seoDescription: {
      type: String,
      maxlength: [160, 'SEO description cannot be more than 160 characters'],
    },
    seoKeywords: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    // Metrics
    views: {
      type: Number,
      default: 0,
    },
    readTime: {
      type: Number,
      default: 5, // Default 5 minutes
    },
    // Block-based content
    blocks: [
      {
        id: String,
        type: {
          type: String,
          enum: ['heading', 'paragraph', 'image', 'image_grid', 'list', 'quote', 'divider', 'video', 'code'],
        },
        level: Number, // For heading: 1-6
        text: String, // For heading, paragraph, quote
        items: [String], // For list
        url: String, // For image, video
        alt: String, // For image
        language: String, // For code
        code: String, // For code block
        caption: String, // For image, video
        columns: Number, // For image_grid
        images: [
          {
            url: String,
            alt: String,
            caption: String,
          },
        ],
      },
    ],
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

// Index for faster queries
newsSchema.index({ slug: 1 })
newsSchema.index({ status: 1, publishedAt: -1 })
newsSchema.index({ category: 1 })
newsSchema.index({ tags: 1 })
newsSchema.index({ featured: 1, status: 1 })

// Virtual to calculate read time from content (300 words per minute average)
newsSchema.virtual('calculatedReadTime').get(function (this: INews) {
  const wordCount = this.content.split(/\s+/).length
  return Math.ceil(wordCount / 300)
})

// Generate slug from title before saving
newsSchema.pre('save', async function (next) {
  if (this.isModified('title')) {
    // Vietnamese character mapping
    const vietnameseMap: { [key: string]: string } = {
      'á': 'a', 'à': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a', 'ă': 'a', 'ắ': 'a', 'ằ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
      'â': 'a', 'ấ': 'a', 'ầ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
      'đ': 'd',
      'é': 'e', 'è': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e', 'ê': 'e', 'ế': 'e', 'ề': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
      'í': 'i', 'ì': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
      'ó': 'o', 'ò': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o', 'ô': 'o', 'ố': 'o', 'ồ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
      'ơ': 'o', 'ớ': 'o', 'ờ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
      'ú': 'u', 'ù': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u', 'ư': 'u', 'ứ': 'u', 'ừ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
      'ý': 'y', 'ỳ': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y'
    }

    let slug = this.title.toLowerCase().trim()
    
    // Replace Vietnamese characters
    slug = slug.split('').map(char => vietnameseMap[char] || char).join('')
    
    // Keep only alphanumeric, spaces, and hyphens
    slug = slug.replace(/[^a-z0-9\s-]/g, '')
    
    // Replace multiple spaces with single dash
    slug = slug.replace(/\s+/g, '-')
    
    // Remove multiple consecutive dashes
    slug = slug.replace(/-+/g, '-')
    
    // Remove leading/trailing dashes
    slug = slug.replace(/^-+|-+$/g, '')
    
    // Limit length
    slug = slug.substring(0, 200)
      
    // Ensure unique slug
    let finalSlug = slug
    let counter = 1
    while (true) {
      const existing = await News.countDocuments({
        slug: finalSlug,
        _id: { $ne: this._id }
      })
      if (existing === 0) {
        this.slug = finalSlug
        break
      }
      counter++
      finalSlug = `${slug}-${counter}`
    }
  }

  // If publishing, set publishedAt
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date()
  }

  next()
})

const News: Model<INews> = mongoose.model<INews>('News', newsSchema)

export default News
export type { INews }
