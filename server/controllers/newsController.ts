import { Request, Response } from 'express'
import News from '../models/News.js'
import User from '../models/User.js'
import AuditLog from '../models/AuditLog.js'

interface AuthRequest extends Request {
  user?: any
}

// ==================== PUBLIC ENDPOINTS ====================

/**
 * GET /api/news
 * Get all published news with pagination, filters, and search
 */
export const getNews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      search, 
      featured = false,
      sort = 'newest'
    } = req.query

    const skip = ((Number(page) - 1) * Number(limit)) as number
    const filter: any = { status: 'published' }

    // Category filter
    if (category && category !== 'all') {
      filter.category = category
    }

    // Featured filter
    if (featured === 'true') {
      filter.featured = true
    }

    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ]
    }

    // Sorting
    let sortQuery: any = { publishedAt: -1 }
    if (sort === 'oldest') {
      sortQuery = { publishedAt: 1 }
    } else if (sort === 'mostviewed') {
      sortQuery = { views: -1 }
    } else if (sort === 'trending') {
      // Published within last 30 days and sorted by views
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      filter.publishedAt = { $gte: thirtyDaysAgo }
      sortQuery = { views: -1 }
    }

    const total = await News.countDocuments(filter)
    const news = await News.find(filter)
      .populate('author', 'name email avatar')
      .sort(sortQuery)
      .skip(skip)
      .limit(Number(limit))
      .lean()

    res.status(200).json({
      success: true,
      data: news,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching news',
      error: error.message,
    })
  }
}

/**
 * GET /api/news/featured
 * Get featured news (limit 6)
 */
export const getFeaturedNews = async (req: Request, res: Response): Promise<void> => {
  try {
    const news = await News.find({ status: 'published', featured: true })
      .populate('author', 'name email avatar')
      .sort({ publishedAt: -1 })
      .limit(6)
      .lean()

    res.status(200).json({
      success: true,
      data: news,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching featured news',
      error: error.message,
    })
  }
}

/**
 * GET /api/news/categories
 * Get all available news categories
 */
export const getNewsCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await News.distinct('category', { status: 'published' })

    res.status(200).json({
      success: true,
      data: categories,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message,
    })
  }
}

/**
 * GET /api/news/:slug
 * Get single news article by slug
 */
export const getNewsBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params

    const news = await News.findOneAndUpdate(
      { slug, status: 'published' },
      { $inc: { views: 1 } },
      { new: true }
    ).populate('author', 'name email avatar')

    if (!news) {
      res.status(404).json({
        success: false,
        message: 'Article not found',
      })
      return
    }

    // Get related articles (same category, different article)
    const relatedNews = await News.find({
      category: news.category,
      status: 'published',
      _id: { $ne: news._id },
    })
      .populate('author', 'name email avatar')
      .sort({ publishedAt: -1 })
      .limit(3)
      .lean()

    res.status(200).json({
      success: true,
      data: {
        news,
        related: relatedNews,
      },
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching article',
      error: error.message,
    })
  }
}

/**
 * GET /api/news/search/tags
 * Get all available tags
 */
export const getNewsTags = async (req: Request, res: Response): Promise<void> => {
  try {
    const tags = await News.distinct('tags', { status: 'published' })

    res.status(200).json({
      success: true,
      data: tags,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tags',
      error: error.message,
    })
  }
}

// ==================== ADMIN ENDPOINTS ====================

/**
 * GET /api/admin/news
 * Get all news (including drafts) for admin
 */
export const getAllNews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, status, search, sort = 'newest' } = req.query
    const skip = ((Number(page) - 1) * Number(limit)) as number

    const filter: any = {}

    // Status filter
    if (status && status !== 'all') {
      filter.status = status
    }

    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
      ]
    }

    // Sorting
    let sortQuery: any = { createdAt: -1 }
    if (sort === 'oldest') {
      sortQuery = { createdAt: 1 }
    } else if (sort === 'recent') {
      sortQuery = { updatedAt: -1 }
    }

    const total = await News.countDocuments(filter)
    const news = await News.find(filter)
      .populate('author', 'name email avatar')
      .sort(sortQuery)
      .skip(skip)
      .limit(Number(limit))

    res.status(200).json({
      success: true,
      data: news,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching news',
      error: error.message,
    })
  }
}

/**
 * POST /api/admin/news
 * Create new article
 */
export const createNews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content, excerpt, category, tags, featured, status, seoTitle, seoDescription, seoKeywords, featuredImage } = req.body
    const userId = req.user?._id

    // Validation
    if (!title || !content || !excerpt) {
      res.status(400).json({
        success: false,
        message: 'Please provide title, content, and excerpt',
      })
      return
    }

    // Create news
    const news = new News({
      title,
      content,
      excerpt,
      category: category || 'News',
      tags: tags || [],
      featured: featured || false,
      status: status || 'draft',
      author: userId,
      seoTitle,
      seoDescription,
      seoKeywords,
      featuredImage,
      readTime: Math.ceil(content.split(/\s+/).length / 300) || 5,
    })

    await news.save()
    await news.populate('author', 'name email avatar')

    // Audit log
    await AuditLog.create({
      action: 'CREATE',
      entity: 'News',
      entityId: news._id,
      newValue: { title: news.title, status: news.status, category: news.category },
      userId: userId,
      ipAddress: req.ip,
    }).catch(() => {})

    res.status(201).json({
      success: true,
      message: 'Article created successfully',
      data: news,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error creating article',
      error: error.message,
    })
  }
}

/**
 * GET /api/admin/news/:id
 * Get article details for editing
 */
export const getNewsDetail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const news = await News.findById(id).populate('author', 'name email avatar')

    if (!news) {
      res.status(404).json({
        success: false,
        message: 'Article not found',
      })
      return
    }

    res.status(200).json({
      success: true,
      data: news,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching article',
      error: error.message,
    })
  }
}

/**
 * PUT /api/admin/news/:id
 * Update article
 */
export const updateNews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { title, content, excerpt, category, tags, featured, status, seoTitle, seoDescription, seoKeywords, featuredImage } = req.body

    const news = await News.findById(id)

    if (!news) {
      res.status(404).json({
        success: false,
        message: 'Article not found',
      })
      return
    }

    // Update fields
    if (title) news.title = title
    if (content) {
      news.content = content
      news.readTime = Math.ceil(content.split(/\s+/).length / 300) || 5
    }
    if (excerpt) news.excerpt = excerpt
    if (category) news.category = category
    if (tags) news.tags = tags
    if (typeof featured !== 'undefined') news.featured = featured
    if (status) news.status = status
    if (seoTitle) news.seoTitle = seoTitle
    if (seoDescription) news.seoDescription = seoDescription
    if (seoKeywords) news.seoKeywords = seoKeywords
    if (featuredImage) news.featuredImage = featuredImage

    await news.save()
    await news.populate('author', 'name email avatar')

    // Audit log
    await AuditLog.create({
      action: 'UPDATE',
      entity: 'News',
      entityId: news._id,
      newValue: { title: news.title, status: news.status },
      userId: req.user?._id,
      ipAddress: req.ip,
    }).catch(() => {})

    res.status(200).json({
      success: true,
      message: 'Article updated successfully',
      data: news,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error updating article',
      error: error.message,
    })
  }
}

/**
 * DELETE /api/admin/news/:id
 * Delete article
 */
export const deleteNews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const news = await News.findByIdAndDelete(id)

    if (!news) {
      res.status(404).json({
        success: false,
        message: 'Article not found',
      })
      return
    }

    // Audit log
    await AuditLog.create({
      action: 'DELETE',
      entity: 'News',
      entityId: id,
      oldValue: { title: news.title, category: news.category },
      userId: req.user?._id,
      ipAddress: req.ip,
    }).catch(() => {})

    res.status(200).json({
      success: true,
      message: 'Article deleted successfully',
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error deleting article',
      error: error.message,
    })
  }
}

/**
 * PATCH /api/admin/news/:id/publish
 * Toggle publish status
 */
export const publishNews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { published } = req.body

    const news = await News.findById(id)

    if (!news) {
      res.status(404).json({
        success: false,
        message: 'Article not found',
      })
      return
    }

    news.status = published ? 'published' : 'draft'
    await news.save()

    // Audit log
    await AuditLog.create({
      action: 'STATUS_CHANGE',
      entity: 'News',
      entityId: news._id,
      changes: { status: { old: published ? 'draft' : 'published', new: news.status } },
      userId: req.user?._id,
      ipAddress: req.ip,
    }).catch(() => {})

    res.status(200).json({
      success: true,
      message: `Article ${published ? 'published' : 'unpublished'} successfully`,
      data: news,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error updating article status',
      error: error.message,
    })
  }
}
