import { Request, Response } from 'express'
import Promotion from '../models/Promotion.js'
import User from '../models/User.js'
import Product from '../models/Product.js'
import Category from '../models/Category.js'
import Platform from '../models/Platform.js'
import AuditLog from '../models/AuditLog.js'

/**
 * GET /api/promotions/admin/all
 * Admin: Lấy tất cả promotions (kể cả inactive/expired) với phân trang, search, filter
 */
export const adminGetAllPromotions = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      search = '',
      type,
      status,
      sort = 'newest',
    } = req.query

    const pageNum = Math.max(1, parseInt(page as string))
    const limitNum = Math.max(1, Math.min(50, parseInt(limit as string)))
    const skip = (pageNum - 1) * limitNum

    // Build filter
    const filter: any = {}

    if (search) {
      filter.code = { $regex: search, $options: 'i' }
    }

    if (type && type !== 'all') {
      filter.type = type
    }

    const now = new Date()
    if (status && status !== 'all') {
      if (status === 'active') {
        filter.isActive = true
        filter.startDate = { $lte: now }
        filter.endDate = { $gte: now }
      } else if (status === 'expired') {
        filter.$or = [
          { endDate: { $lt: now } },
          { isActive: false },
        ]
      } else if (status === 'scheduled') {
        filter.isActive = true
        filter.startDate = { $gt: now }
      }
    }

    // Build sort
    let sortQuery: any = { createdAt: -1 }
    if (sort === 'oldest') sortQuery = { createdAt: 1 }
    else if (sort === 'code') sortQuery = { code: 1 }
    else if (sort === 'value') sortQuery = { value: -1 }
    else if (sort === 'usage') sortQuery = { usedCount: -1 }

    const [promotions, total] = await Promise.all([
      Promotion.find(filter)
        .select('-usedByUsers')
        .sort(sortQuery)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Promotion.countDocuments(filter),
    ])

    // Stats
    const allPromos = await Promotion.find().select('isActive startDate endDate type value usedCount usageLimit').lean()
    const activeCount = allPromos.filter(p => p.isActive && p.startDate <= now && p.endDate >= now).length
    const totalRedemptions = allPromos.reduce((sum, p) => sum + (p.usedCount || 0), 0)

    // Add computed status to each promotion
    const enriched = promotions.map(p => {
      let computedStatus: 'active' | 'expired' | 'scheduled' = 'expired'
      if (p.isActive && p.startDate <= now && p.endDate >= now) {
        computedStatus = 'active'
      } else if (p.isActive && p.startDate > now) {
        computedStatus = 'scheduled'
      }
      return { ...p, computedStatus }
    })

    res.json({
      success: true,
      data: enriched,
      stats: {
        activeCount,
        totalRedemptions,
        total: allPromos.length,
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    })
  } catch (error) {
    console.error('Admin get promotions error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch promotions' })
  }
}

/**
 * GET /api/promotions/admin/:id
 * Admin: Lấy chi tiết promotion by ID
 */
export const adminGetPromotionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const promotion = await Promotion.findById(id)
      .populate('applicableProducts', 'name slug images')
      .populate('applicableCategories', 'name slug')
      .populate('applicablePlatforms', 'name slug logo')
      .populate('excludeProducts', 'name slug images')
      .populate('usedByUsers', 'name email avatar')
      .lean()

    if (!promotion) {
      return res.status(404).json({ success: false, error: 'Promotion not found' })
    }

    res.json({ success: true, data: promotion })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch promotion' })
  }
}

/**
 * GET /api/promotions
 * Lấy tất cả promotions active
 */
export const getAllPromotions = async (req: Request, res: Response) => {
  try {
    const now = new Date()
    const promotions = await Promotion.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .select('-usedByUsers')
      .sort({ badge: 1, createdAt: -1 }) // prioritize badges at top
      .lean()

    res.json({
      success: true,
      data: promotions,
      count: promotions.length,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch promotions',
    })
  }
}

/**
 * GET /api/promotions/:code
 * Lấy chi tiết một promotion
 */
export const getPromotionByCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.params
    const promotion = await Promotion.findOne({ code: code.toUpperCase() })
      .select('-usedByUsers')
      .lean()

    if (!promotion) {
      return res.status(404).json({
        success: false,
        error: 'Promotion not found',
      })
    }

    res.json({
      success: true,
      data: promotion,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch promotion',
    })
  }
}

/**
 * POST /api/promotions/validate
 * Validate promotion code based on conditions
 * Body: { code, userId?, orderValue, cartItems: {productId, categoryId}[] }
 */
export const validatePromotion = async (req: Request, res: Response) => {
  try {
    const { code, userId, orderValue = 0, cartItems = [] } = req.body

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Promotion code is required',
      })
    }

    const promotion = await Promotion.findOne({
      code: code.toUpperCase(),
      isActive: true,
    })

    if (!promotion) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired promotion code',
      })
    }

    // Kiểm tra đã hết hạn sử dụng
    if (promotion.usedCount >= promotion.usageLimit) {
      return res.status(400).json({
        success: false,
        error: 'Promotion code has reached usage limit',
      })
    }

    // Kiểm tra ngày bắt đầu/kết thúc
    const now = new Date()
    if (now < promotion.startDate || now > promotion.endDate) {
      return res.status(400).json({
        success: false,
        error: 'Promotion code is not active',
      })
    }

    // Kiểm tra minimal order value
    if (promotion.minOrderValue && orderValue < promotion.minOrderValue) {
      return res.status(400).json({
        success: false,
        error: `Minimum order value is ${promotion.minOrderValue.toLocaleString()} VND`,
      })
    }

    // Kiểm tra nếu dành cho thành viên mới
    if (promotion.applicableToNewMembersOnly && userId) {
      const user = await User.findById(userId).select('createdAt').lean()
      if (!user) {
        return res.status(400).json({
          success: false,
          error: 'User not found',
        })
      }

      const accountAgeDays =
        (now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      if (accountAgeDays > 30) {
        return res.status(400).json({
          success: false,
          error: 'This promotion is only for new members',
        })
      }
    }

    // Kiểm tra usage per user
    if (userId && promotion.usagePerUser && promotion.usagePerUser > 0) {
      const userUsageCount = (promotion.usedByUsers || []).filter(
        (id) => id.toString() === userId
      ).length

      if (userUsageCount >= promotion.usagePerUser) {
        return res.status(400).json({
          success: false,
          error: `You have already used this promotion ${promotion.usagePerUser} time(s)`,
        })
      }
    }

    // Kiểm tra applicable products/categories/brands (nếu cart items được cung cấp)
    if (
      cartItems.length > 0 &&
      (promotion.applicableProducts?.length ||
        promotion.applicableCategories?.length ||
        promotion.applicablePlatforms?.length)
    ) {
      const isApplicable = await checkProductApplicability(
        promotion,
        cartItems
      )

      if (!isApplicable) {
        return res.status(400).json({
          success: false,
          error: 'Promotion code is not applicable to items in your cart',
        })
      }
    }

    // Tính toán discount
    let discountAmount = 0
    if (promotion.type === 'percentage') {
      discountAmount = Math.floor((orderValue * promotion.value) / 100)
      if (promotion.maxDiscount && discountAmount > promotion.maxDiscount) {
        discountAmount = promotion.maxDiscount
      }
    } else {
      discountAmount = promotion.value
    }

    // Final order value cannot be negative
    const finalOrderValue = Math.max(0, orderValue - discountAmount)

    res.json({
      success: true,
      data: {
        code: promotion.code,
        type: promotion.type,
        value: promotion.value,
        description: promotion.description,
        discount: discountAmount,
        originalValue: orderValue,
        finalValue: finalOrderValue,
      },
    })
  } catch (error) {
    console.error('Validation error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to validate promotion',
    })
  }
}

/**
 * POST /api/promotions/apply
 * Áp dụng promotion (increment usedCount, add user to usedByUsers)
 * Body: { promotionId, userId? }
 */
export const applyPromotion = async (req: Request, res: Response) => {
  try {
    const { promotionId, userId } = req.body

    if (!promotionId) {
      return res.status(400).json({
        success: false,
        error: 'Promotion ID is required',
      })
    }

    const promotion = await Promotion.findByIdAndUpdate(
      promotionId,
      {
        $inc: { usedCount: 1 },
      },
      { new: true }
    )

    // Add user to usedByUsers if provided
    if (userId && promotion) {
      await Promotion.findByIdAndUpdate(
        promotionId,
        {
          $addToSet: { usedByUsers: userId },
        }
      )
    }

    res.json({
      success: true,
      message: 'Promotion applied successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to apply promotion',
    })
  }
}

/**
 * Kiểm tra xem sản phẩm có áp dụng được promotion không
 */
async function checkProductApplicability(
  promotion: any,
  cartItems: { productId?: string; categoryId?: string; platformId?: string }[]
) {
  // Nếu không có giới hạn specific products/categories, áp dụng cho tất cả
  if (
    (!promotion.applicableProducts || promotion.applicableProducts.length === 0) &&
    (!promotion.applicableCategories ||
      promotion.applicableCategories.length === 0) &&
    (!promotion.applicablePlatforms || promotion.applicablePlatforms.length === 0)
  ) {
    return true
  }

  // Kiểm tra từng item trong cart
  for (const item of cartItems) {
    let isItemApplicable = false

    // Kiểm tra applicable products
    if (
      promotion.applicableProducts &&
      promotion.applicableProducts.length > 0 &&
      item.productId
    ) {
      if (
        promotion.applicableProducts.some(
          (id: any) => id.toString() === item.productId
        )
      ) {
        isItemApplicable = true
      }
    }

    // Kiểm tra applicable categories
    if (
      !isItemApplicable &&
      promotion.applicableCategories &&
      promotion.applicableCategories.length > 0 &&
      item.categoryId
    ) {
      if (
        promotion.applicableCategories.some(
          (id: any) => id.toString() === item.categoryId
        )
      ) {
        isItemApplicable = true
      }
    }

    // Kiểm tra applicable platforms
    if (
      !isItemApplicable &&
      promotion.applicablePlatforms &&
      promotion.applicablePlatforms.length > 0 &&
      item.platformId
    ) {
      if (
        promotion.applicablePlatforms.some((id: any) => id.toString() === item.platformId)
      ) {
        isItemApplicable = true
      }
    }

    // Kiểm tra exclude products
    if (
      isItemApplicable &&
      promotion.excludeProducts &&
      promotion.excludeProducts.length > 0 &&
      item.productId
    ) {
      if (
        promotion.excludeProducts.some(
          (id: any) => id.toString() === item.productId
        )
      ) {
        isItemApplicable = false
      }
    }

    // Nếu item này không áp dụng, toàn bộ không áp dụng (all-or-nothing)
    if (!isItemApplicable) {
      return false
    }
  }

  return true
}

/**
 * POST /api/promotions (ADMIN)
 * Tạo promotion mới
 */
export const createPromotion = async (req: Request, res: Response) => {
  try {
    const promotion = new Promotion(req.body)
    await promotion.save()

    // Audit log
    await AuditLog.create({
      action: 'CREATE',
      entity: 'Promotion',
      entityId: promotion._id,
      newValue: { code: promotion.code, type: promotion.type, value: promotion.value },
      userId: (req as any).user?._id,
      ipAddress: req.ip,
    }).catch(() => {})

    res.status(201).json({
      success: true,
      data: promotion,
    })
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    })
  }
}

/**
 * PUT /api/promotions/:id (ADMIN)
 * Cập nhật promotion
 */
export const updatePromotion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const oldPromo = await Promotion.findById(id).lean()
    const promotion = await Promotion.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })

    if (!promotion) {
      return res.status(404).json({
        success: false,
        error: 'Promotion not found',
      })
    }

    // Audit log
    await AuditLog.create({
      action: 'UPDATE',
      entity: 'Promotion',
      entityId: promotion._id,
      oldValue: oldPromo ? { code: oldPromo.code, type: oldPromo.type, value: oldPromo.value, isActive: oldPromo.isActive } : null,
      newValue: { code: promotion.code, type: promotion.type, value: promotion.value, isActive: promotion.isActive },
      userId: (req as any).user?._id,
      ipAddress: req.ip,
    }).catch(() => {})

    res.json({
      success: true,
      data: promotion,
    })
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    })
  }
}

/**
 * DELETE /api/promotions/:id (ADMIN)
 * Xóa promotion
 */
export const deletePromotion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const promotion = await Promotion.findByIdAndDelete(id)

    if (!promotion) {
      return res.status(404).json({
        success: false,
        error: 'Promotion not found',
      })
    }

    // Audit log
    await AuditLog.create({
      action: 'DELETE',
      entity: 'Promotion',
      entityId: id,
      oldValue: { code: promotion.code, type: promotion.type, value: promotion.value },
      userId: (req as any).user?._id,
      ipAddress: req.ip,
    }).catch(() => {})

    res.json({
      success: true,
      message: 'Promotion deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete promotion',
    })
  }
}
