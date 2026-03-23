import { Request, Response } from 'express'
import Comment from '../models/Comment.js'
import News from '../models/News.js'

interface AuthRequest extends Request {
  user?: any
}

/**
 * POST /api/comments
 * Create a new comment (Public OR Authenticated)
 */
export const createComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let { newsId, name, email, content } = req.body
    const userId = req.user?._id

    // Validate required fields
    if (!newsId || !email || !content) {
      res.status(400).json({
        success: false,
        message: 'Please provide newsId, email, and content',
      })
      return
    }

    // If authenticated, auto-fill name from user profile, or use provided name
    if (userId && !name) {
      const User = (await import('../models/User.js')).default
      const user = await User.findById(userId).select('name')
      name = user?.name || 'Anonymous'
    }

    // Name is required (either from request or from authenticated user)
    if (!name) {
      res.status(400).json({
        success: false,
        message: 'Please provide your name',
      })
      return
    }

    // Validate news exists
    const newsExists = await News.findById(newsId)
    if (!newsExists) {
      res.status(404).json({
        success: false,
        message: 'News article not found',
      })
      return
    }

    // Create comment
    const comment = await Comment.create({
      newsId,
      userId: userId || undefined,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      content: content.trim(),
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'approved', // Change to 'pending' for moderation workflow
    })

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: comment,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error creating comment',
      error: error.message,
    })
  }
}

/**
 * GET /api/comments/:newsId
 * Get comments for a specific news article
 */
export const getCommentsByNews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { newsId } = req.params
    const { page = 1, limit = 10, sort = 'newest' } = req.query

    const skip = ((Number(page) - 1) * Number(limit)) as number
    const sortQuery = sort === 'oldest' ? ({ createdAt: 1 } as const) : ({ createdAt: -1 } as const)

    // Get comments
    const comments = await Comment.find({
      newsId,
      status: 'approved',
    })
      .populate('userId', 'name email avatar')
      .sort(sortQuery as any)
      .skip(skip)
      .limit(Number(limit))
      .lean()

    // Get total count
    const total = await Comment.countDocuments({
      newsId,
      status: 'approved',
    })

    res.status(200).json({
      success: true,
      data: comments,
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
      message: 'Error fetching comments',
      error: error.message,
    })
  }
}

/**
 * GET /api/comments/:newsId/count
 * Get comment count for a specific news article
 */
export const getCommentCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { newsId } = req.params

    const count = await Comment.countDocuments({
      newsId,
      status: 'approved',
    })

    res.status(200).json({
      success: true,
      data: { count },
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching comment count',
      error: error.message,
    })
  }
}

/**
 * DELETE /api/admin/comments/:commentId
 * Delete a comment (admin only)
 */
export const deleteComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params

    const comment = await Comment.findByIdAndDelete(commentId)

    if (!comment) {
      res.status(404).json({
        success: false,
        message: 'Comment not found',
      })
      return
    }

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error deleting comment',
      error: error.message,
    })
  }
}

/**
 * PATCH /api/admin/comments/:commentId/status
 * Update comment status (admin only)
 */
export const updateCommentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params
    const { status } = req.body

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, approved, or rejected',
      })
      return
    }

    const comment = await Comment.findByIdAndUpdate(
      commentId,
      { status },
      { new: true, runValidators: true }
    )

    if (!comment) {
      res.status(404).json({
        success: false,
        message: 'Comment not found',
      })
      return
    }

    res.status(200).json({
      success: true,
      message: 'Comment status updated successfully',
      data: comment,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error updating comment status',
      error: error.message,
    })
  }
}

/**
 * GET /api/admin/comments
 * Get all comments (admin)
 */
export const getAllComments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, status, newsId } = req.query

    const skip = ((Number(page) - 1) * Number(limit)) as number
    const filter: any = {}

    if (status) filter.status = status
    if (newsId) filter.newsId = newsId

    const comments = await Comment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('newsId', 'title slug')
      .lean()

    const total = await Comment.countDocuments(filter)

    res.status(200).json({
      success: true,
      data: comments,
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
      message: 'Error fetching comments',
      error: error.message,
    })
  }
}
