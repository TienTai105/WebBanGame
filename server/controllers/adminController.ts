import { Request, Response } from 'express'
import User from '../models/User.js'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import Inventory from '../models/Inventory.js'
import OTPVerification from '../models/OTPVerification.js'
import AuditLog from '../models/AuditLog.js'
import * as otpService from '../services/otpService.js'
import * as productController from './productController.js'
import { getOnlineUserIds, getOnlineCount } from '../socket.js'

interface AdminRequest extends Request {
  user?: {
    _id: string
    email?: string
    role?: 'customer' | 'staff' | 'admin'
  }
}

/**
 * GET /api/admin/dashboard/stats
 * Get dashboard KPI statistics with optional date range filter
 * Query params: startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)
 */
export const getDashboardStats = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    // Parse date range from query params
    const { startDate, endDate, comparisonType = 'previousPeriod' } = req.query
    
    let filterStartDate: Date
    let filterEndDate: Date

    if (startDate && endDate) {
      // Use provided date range
      filterStartDate = new Date(startDate as string)
      filterEndDate = new Date(endDate as string)
      // Set end date to end of day
      filterEndDate.setHours(23, 59, 59, 999)
    } else {
      // Default: current month
      const now = new Date()
      filterStartDate = new Date(now.getFullYear(), now.getMonth(), 1)
      filterEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      filterEndDate.setHours(23, 59, 59, 999)
    }

    // Calculate comparison period based on selected type
    let previousStartDate: Date
    let previousEndDate: Date

    const comparisonTypeStr = (comparisonType as string).toLowerCase()
    if (comparisonTypeStr === 'yesterday') {
      // Compare with previous single day
      previousStartDate = new Date(filterStartDate.getTime() - 24 * 60 * 60 * 1000)
      previousStartDate.setHours(0, 0, 0, 0)
      previousEndDate = new Date(previousStartDate.getTime() + 24 * 60 * 60 * 1000 - 1)
    } else if (comparisonTypeStr === 'lastmonth') {
      // Compare with same period last month
      previousStartDate = new Date(filterStartDate)
      previousStartDate.setMonth(previousStartDate.getMonth() - 1)
      previousEndDate = new Date(filterEndDate)
      previousEndDate.setMonth(previousEndDate.getMonth() - 1)
    } else if (comparisonTypeStr === 'yearoveryear') {
      // Compare with same period last year
      previousStartDate = new Date(filterStartDate)
      previousStartDate.setFullYear(previousStartDate.getFullYear() - 1)
      previousEndDate = new Date(filterEndDate)
      previousEndDate.setFullYear(previousEndDate.getFullYear() - 1)
    } else {
      // Default: previousPeriod - same duration, shifted back
      const rangeMs = filterEndDate.getTime() - filterStartDate.getTime()
      previousStartDate = new Date(filterStartDate.getTime() - rangeMs)
      previousEndDate = new Date(filterStartDate.getTime() - 1)
    }

    // Revenue stats for selected period (completed orders only)
    const selectedPeriodRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: filterStartDate, $lte: filterEndDate },
          orderStatus: 'completed',
        },
      },
      { $group: { _id: null, total: { $sum: '$finalPrice' } } },
    ])

    // Revenue stats for previous period (for trend calculation)
    const previousPeriodRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: previousStartDate, $lt: filterStartDate },
          orderStatus: 'completed',
        },
      },
      { $group: { _id: null, total: { $sum: '$finalPrice' } } },
    ])

    // Calculate percentage change
    const currentRevenue = selectedPeriodRevenue[0]?.total || 0
    const previousRevenue = previousPeriodRevenue[0]?.total || 0
    const percentChange = previousRevenue > 0 
      ? (((currentRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1)
      : 0

    // Order stats for selected period
    const orderStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: filterStartDate, $lte: filterEndDate },
        },
      },
      {
        $facet: {
          total: [{ $count: 'count' }],
          pending: [{ $match: { orderStatus: 'pending' } }, { $count: 'count' }],
          processing: [{ $match: { orderStatus: 'processing' } }, { $count: 'count' }],
          shipped: [{ $match: { orderStatus: 'shipped' } }, { $count: 'count' }],
          completed: [{ $match: { orderStatus: 'completed' } }, { $count: 'count' }],
          cancelled: [{ $match: { orderStatus: 'cancelled' } }, { $count: 'count' }],
          failed: [{ $match: { orderStatus: 'failed' } }, { $count: 'count' }],
        },
      },
    ])

    // Customer stats for selected period
    const totalCustomers = await User.countDocuments({ role: 'customer' })
    const newCustomersInPeriod = await User.countDocuments({
      role: 'customer',
      createdAt: { $gte: filterStartDate, $lte: filterEndDate },
    })

    // Low stock products from Inventory (not period-dependent)
    const lowStockProducts = await Inventory.aggregate([
      {
        $match: {
          available: { $lt: 10 },
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      {
        $unwind: '$productInfo',
      },
      {
        $project: {
          _id: '$productId',
          name: '$productInfo.name',
          sku: { $ifNull: ['$variantSku', '$productInfo.sku'] },
          stock: '$available',
          image: {
            $cond: [
              { $isArray: '$productInfo.images' },
              { $arrayElemAt: ['$productInfo.images', 0] },
              null,
            ],
          },
        },
      },
      {
        $sort: { stock: 1 },
      },
      {
        $limit: 10,
      },
    ])

    // Daily revenue for current period (for chart)
    const currentPeriodDailyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: filterStartDate, $lte: filterEndDate },
          orderStatus: 'completed',
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          revenue: { $sum: '$finalPrice' },
        },
      },
      { $sort: { _id: 1 } },
    ])

    // Daily revenue for previous period (for comparison)
    const previousPeriodDailyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: previousStartDate, $lte: previousEndDate },
          orderStatus: 'completed',
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          revenue: { $sum: '$finalPrice' },
        },
      },
      { $sort: { _id: 1 } },
    ])

    // Top selling products in selected period
    const topSellingProducts = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: filterStartDate, $lte: filterEndDate },
          orderStatus: 'completed',
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.productName' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
    ])

    // Recent orders (last 10 orders, any period)
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'firstName lastName email')
      .lean()
      .then(orders => orders.map((order: any) => ({
        _id: order._id,
        orderNumber: order.orderNumber || `#VTX-${order._id.toString().slice(-4).toUpperCase()}`,
        customerName: order.user?.firstName && order.user?.lastName 
          ? `${order.user.firstName} ${order.user.lastName}`
          : order.user?.email || 'Unknown',
        totalAmount: order.finalPrice || order.totalPrice || 0,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt,
      })))

    // Product stats
    const totalProducts = await Product.countDocuments()
    const activeProducts = await Product.countDocuments({ status: 'active' })

    // News stats (try to get from News model if exists)
    let totalNews = 0
    let publishedNews = 0
    try {
      const News = await import('../models/News.js').then(m => m.default)
      totalNews = await News.countDocuments()
      publishedNews = await News.countDocuments({ status: 'published' })
    } catch (e) {
      // News model might not exist yet
    }

    // Promotion/Coupon stats (try to get from Promotion model if exists)
    let totalPromotions = 0
    let activePromotions = 0
    try {
      const Promotion = await import('../models/Promotion.js').then(m => m.default)
      totalPromotions = await Promotion.countDocuments()
      activePromotions = await Promotion.countDocuments({ isActive: true })
    } catch (e) {
      // Promotion model might not exist yet
    }

    // Payment methods stats for selected period (completed orders only)
    const paymentMethods = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: filterStartDate, $lte: filterEndDate },
          orderStatus: 'completed',
        },
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          revenue: { $sum: '$finalPrice' },
        },
      },
      { $sort: { count: -1 } },
    ])

    res.status(200).json({
      success: true,
      data: {
        revenue: {
          current: currentRevenue,
          percentChange: Number(percentChange),
        },
        orders: {
          total: orderStats[0].total[0]?.count || 0,
          pending: orderStats[0].pending[0]?.count || 0,
          processing: orderStats[0].processing[0]?.count || 0,
          shipped: orderStats[0].shipped[0]?.count || 0,
          completed: orderStats[0].completed[0]?.count || 0,
          cancelled: orderStats[0].cancelled[0]?.count || 0,
          failed: orderStats[0].failed[0]?.count || 0,
        },
        customers: {
          total: totalCustomers,
          newToday: newCustomersInPeriod,
          newThisWeek: newCustomersInPeriod,
        },
        lowStockProducts: lowStockProducts.map((product: any) => ({
          _id: product._id,
          name: product.name,
          sku: product.sku,
          stock: product.stock,
          image: product.image?.url || null,
        })),
        topSellingProducts: topSellingProducts.map((item: any) => ({
          _id: item._id,
          name: item.productName,
          quantity: item.totalQuantity,
          revenue: item.totalRevenue,
        })),
        recentOrders: recentOrders,
        revenueChart: {
          comparisonType: comparisonTypeStr,
          current: currentPeriodDailyRevenue.map((item: any) => ({
            date: item._id,
            revenue: item.revenue,
          })),
          previous: previousPeriodDailyRevenue.map((item: any) => ({
            date: item._id,
            revenue: item.revenue,
          })),
        },
        products: {
          total: totalProducts,
          active: activeProducts,
          inactive: totalProducts - activeProducts,
        },
        blogPosts: {
          total: totalNews,
          published: publishedNews,
          draft: totalNews - publishedNews,
        },
        promotions: {
          total: totalPromotions,
          active: activePromotions,
          inactive: totalPromotions - activePromotions,
        },
        paymentMethods: paymentMethods.map((item: any) => ({
          name: item._id || 'Unknown',
          value: item.count,
          revenue: item.revenue,
        })),
      },
    })
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch dashboard stats',
    })
  }
}

/**
 * POST /api/admin/otp/generate
 * Generate and send OTP for sensitive action
 */
export const generateOTP = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { action, actionData } = req.body
    const userId = req.user?._id

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' })
      return
    }

    if (!action) {
      res.status(400).json({ success: false, message: 'Action is required' })
      return
    }

    // Generate OTP
    const otp = otpService.generateOTP()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Save OTP record
    const otpRecord = await OTPVerification.create({
      userId,
      otp,
      action,
      actionData: actionData || null,
      expiresAt,
    })

    // Get user email
    const user = await User.findById(userId)
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }

    // Send OTP email
    const emailSent = await otpService.sendOTPEmail(user.email, otp, action)

    if (!emailSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP email',
      })
      return
    }

    res.status(200).json({
      success: true,
      data: {
        otpId: otpRecord._id,
        expiresAt,
      },
      message: `OTP sent to ${user.email}`,
    })
  } catch (error: any) {
    console.error('Error generating OTP:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate OTP',
    })
  }
}

/**
 * POST /api/admin/otp/verify
 * Verify OTP code
 */
export const verifyOTP = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { otpId, code } = req.body
    const userId = req.user?._id

    if (!otpId || !code) {
      res.status(400).json({ success: false, message: 'OTP ID and code are required' })
      return
    }

    const otpRecord = await OTPVerification.findById(otpId)

    if (!otpRecord) {
      res.status(400).json({ success: false, message: 'OTP not found or expired' })
      return
    }

    // Check if OTP belongs to this user
    if (otpRecord.userId.toString() !== userId) {
      res.status(403).json({ success: false, message: 'OTP does not belong to this user' })
      return
    }

    // Check if OTP has expired
    if (new Date() > otpRecord.expiresAt) {
      await OTPVerification.deleteOne({ _id: otpId })
      res.status(400).json({ success: false, message: 'OTP has expired' })
      return
    }

    // Check if max attempts exceeded
    if (otpRecord.attempts >= 3) {
      await OTPVerification.deleteOne({ _id: otpId })
      res.status(400).json({
        success: false,
        message: 'Max OTP verification attempts exceeded',
      })
      return
    }

    // Verify OTP
    if (otpRecord.otp !== code) {
      otpRecord.attempts += 1
      await otpRecord.save()

      res.status(400).json({
        success: false,
        message: `Invalid OTP. ${3 - otpRecord.attempts} attempts remaining`,
      })
      return
    }

    // Mark as verified
    otpRecord.verified = true
    await otpRecord.save()

    res.status(200).json({
      success: true,
      data: {
        otpToken: otpRecord._id,
      },
      message: 'OTP verified successfully',
    })
  } catch (error: any) {
    console.error('Error verifying OTP:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify OTP',
    })
  }
}

/**
 * GET /api/admin/audit-logs
 * Get audit logs with filters
 */
export const getAuditLogs = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, action, entity, userId, adminOnly } = req.query

    const query: any = {}

    if (action) query.action = action
    if (entity) query.entity = entity
    if (userId) query.userId = userId

    // Filter: only show logs where actor != target (exclude self-login/self-update)
    if (adminOnly === 'true') {
      query.$expr = { $ne: ['$userId', '$entityId'] }
    }

    const skip = ((Number(page) || 1) - 1) * (Number(limit) || 20)
    const logs = await AuditLog.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit) || 20)

    // Resolve target entity names for User entity logs
    const logsData = logs.map((l) => l.toObject())
    const userEntityIds = logsData
      .filter((l) => l.entity === 'User' && l.entityId)
      .map((l) => l.entityId)
    if (userEntityIds.length > 0) {
      const targetUsers = await User.find({ _id: { $in: userEntityIds } }).select('name email').lean()
      const targetMap = new Map(targetUsers.map((u) => [u._id.toString(), u]))
      for (const log of logsData) {
        if (log.entity === 'User' && log.entityId) {
          const target = targetMap.get(log.entityId.toString())
          if (target) (log as any).targetUser = { name: target.name, email: target.email }
        }
      }
    }

    const total = await AuditLog.countDocuments(query)

    res.status(200).json({
      success: true,
      data: {
        logs: logsData,
        pagination: {
          current: Number(page) || 1,
          limit: Number(limit) || 20,
          total,
          pages: Math.ceil(total / (Number(limit) || 20)),
        },
      },
    })
  } catch (error: any) {
    console.error('Error fetching audit logs:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch audit logs',
    })
  }
}

/**
 * GET /api/admin/users
 * Get list of admin/staff users
 */
export const getAdminUsers = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, role, status, scope, search } = req.query

    const query: any = {}

    // scope=all returns all users, default returns only admin/staff
    if (scope !== 'all') {
      query.role = { $in: ['admin', 'staff'] }
    }

    if (role) query.role = role
    if (status) query.isActive = status === 'active'
    if (search) {
      const s = String(search).trim()
      query.$or = [
        { name: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { phone: { $regex: s, $options: 'i' } },
      ]
    }

    const skip = ((Number(page) || 1) - 1) * (Number(limit) || 20)
    const users = await User.find(query)
      .select('name email phone role isActive avatar createdAt updatedAt lastLogin lastActivity')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit) || 20)

    const total = await User.countDocuments(query)

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          current: Number(page) || 1,
          limit: Number(limit) || 20,
          total,
          pages: Math.ceil(total / (Number(limit) || 20)),
        },
      },
    })
  } catch (error: any) {
    console.error('Error fetching admin users:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch admin users',
    })
  }
}

/**
 * GET /api/admin/users/stats
 * Get user statistics
 */
export const getUserStats = async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const [totalUsers, totalAdmins, totalStaff, activeUsers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'staff' }),
      User.countDocuments({ isActive: true }),
    ])

    // Real-time online count from Socket.IO
    const onlineUsers = getOnlineCount()
    const onlineUserIds = getOnlineUserIds()

    res.status(200).json({
      success: true,
      data: { totalUsers, totalAdmins, totalStaff, activeUsers, onlineUsers, onlineUserIds },
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * PUT /api/admin/users/:id/toggle-active
 * Toggle user active status
 */
export const toggleUserActive = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const user = await User.findById(id)
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }

    // Prevent disabling yourself
    if (user._id.toString() === req.user?._id) {
      res.status(400).json({ success: false, message: 'Không thể vô hiệu hóa chính mình' })
      return
    }

    // Prevent disabling admin accounts
    if (user.role === 'admin') {
      res.status(403).json({ success: false, message: 'Không thể vô hiệu hóa tài khoản Admin' })
      return
    }

    const oldActive = user.isActive
    user.isActive = !user.isActive
    await user.save()

    await AuditLog.create({
      action: 'STATUS_CHANGE',
      entity: 'User',
      entityId: id,
      changes: { isActive: { old: oldActive, new: user.isActive } },
      userId: req.user?._id,
      ipAddress: req.ip,
    })

    res.status(200).json({
      success: true,
      data: { user },
      message: user.isActive ? 'Đã kích hoạt tài khoản' : 'Đã vô hiệu hóa tài khoản',
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * PUT /api/admin/users/:id/role
 * Change user role (ADMIN only)
 */
export const changeUserRole = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { role } = req.body

    if (!['admin', 'staff', 'customer'].includes(role)) {
      res.status(400).json({ success: false, message: 'Invalid role' })
      return
    }

    const user = await User.findById(id)
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }

    // Prevent changing admin role
    if (user.role === 'admin') {
      res.status(403).json({ success: false, message: 'Không thể thay đổi vai trò của tài khoản Admin' })
      return
    }

    const oldRole = user.role
    user.role = role
    await user.save()

    // Log to audit
    await AuditLog.create({
      userId: req.user?._id,
      action: 'UPDATE',
      entity: 'User',
      entityId: id,
      changes: {
        role: {
          old: oldRole,
          new: role,
        },
      },
      ipAddress: req.ip,
    })

    res.status(200).json({
      success: true,
      data: { user },
      message: 'User role updated successfully',
    })
  } catch (error: any) {
    console.error('Error changing user role:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to change user role',
    })
  }
}

/**
 * POST /api/admin/users/:id/reset-password
 * Send password reset email
 */
export const resetUserPassword = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const user = await User.findById(id)
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }

    // Generate reset token (for simplicity, using OTP)
    const resetOTP = otpService.generateOTP()
    const resetToken = Buffer.from(`${user._id}:${resetOTP}`).toString('base64')

    // Send email
    const resetLink = `${process.env.CLIENT_URL}/admin/reset-password?token=${resetToken}`
    const emailSent = await otpService.sendVerificationEmail(user.email, resetLink)

    if (!emailSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to send reset email',
      })
      return
    }

    res.status(200).json({
      success: true,
      message: `Password reset email sent to ${user.email}`,
    })
  } catch (error: any) {
    console.error('Error resetting password:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reset password',
    })
  }
}

/**
 * POST /api/admin/users
 * Create a new user (ADMIN only)
 */
export const createUser = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, phone } = req.body

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Tên, email và mật khẩu là bắt buộc' })
      return
    }

    if (!['customer', 'staff', 'admin'].includes(role || 'customer')) {
      res.status(400).json({ success: false, message: 'Vai trò không hợp lệ' })
      return
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      res.status(409).json({ success: false, message: 'Email đã được sử dụng' })
      return
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'customer',
      phone: phone || null,
      isActive: true,
      emailVerified: true,
    })

    await AuditLog.create({
      userId: req.user?._id,
      action: 'CREATE',
      entity: 'User',
      entityId: user._id,
      newValue: { name, email, role: role || 'customer' },
      ipAddress: req.ip,
    })

    res.status(201).json({
      success: true,
      data: { user: { _id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive } },
      message: 'Tạo tài khoản thành công',
    })
  } catch (error: any) {
    console.error('Error creating user:', error)
    res.status(500).json({ success: false, message: error.message || 'Không thể tạo tài khoản' })
  }
}

/**
 * GET /api/admin/products
 * Get all products with pagination, filtering, and sorting
 * Query params: page, limit, categoryId, search
 */
export const getAdminProducts = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    console.log('📦 Getting admin products...')
    console.log('User:', { _id: req.user?._id, role: req.user?.role })
    
    const { page = 1, limit = 10, categoryId, search } = req.query
    console.log('Query params:', { page, limit, categoryId, search })

    const pageNum = Math.max(1, parseInt(page as string) || 1)
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string) || 10))
    const skip = (pageNum - 1) * limitNum

    // Build filter
    const filter: any = {}
    if (categoryId) {
      filter.categoryId = categoryId
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }

    console.log('Filter:', filter)

    // Fetch products with pagination
    const products = await Product.find(filter)
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean()

    console.log(`Found ${products.length} products`)
    if (products.length > 0) {
      console.log('📦 Sample product from DB:', JSON.stringify(products[0], null, 2))
      
      // Debug: Check variant images
      if (products[0].variants && products[0].variants.length > 0) {
        console.log('🖼️ First variant of first product:', {
          sku: products[0].variants[0].sku,
          name: products[0].variants[0].name,
          hasImages: !!products[0].variants[0].images,
          imagesLength: products[0].variants[0].images?.length,
          imagesData: products[0].variants[0].images,
        })
      }
    }

    // Get stock info from Inventory
    const productsWithStock = await Promise.all(
      products.map(async (product: any) => {
        const inventory = await Inventory.findOne({ productId: product._id }).lean()
        
        // If product has variants, get inventory for each variant
        let variantsWithStock = product.variants
        if (product.variants && product.variants.length > 0) {
          variantsWithStock = await Promise.all(
            product.variants.map(async (variant: any) => {
              const variantInventory = await Inventory.findOne({
                productId: product._id,
                variantSku: variant.sku
              }).lean()
              return {
                ...variant,
                stock: variantInventory?.available || variant.stock || 0,
              }
            })
          )
        }
        
        return {
          ...product,
          variants: variantsWithStock,
          stock: inventory?.available || 0,
          minPrice: product.minPrice || product.price,
          maxPrice: product.maxPrice || product.finalPrice || product.price,
        }
      })
    )

    // Get total count for pagination
    const total = await Product.countDocuments(filter)
    const pages = Math.ceil(total / limitNum)

    console.log(`Returning ${productsWithStock.length} products, total: ${total}`)

    res.status(200).json({
      success: true,
      data: productsWithStock,
      total,
      page: pageNum,
      pages,
    })
  } catch (error: any) {
    console.error('❌ Error fetching admin products:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch products',
    })
  }
}

/**
 * DELETE /api/admin/products/:id
 * Delete a product
 */
export const deleteAdminProduct = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const product = await Product.findById(id)
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' })
      return
    }

    // Delete product and its inventory
    await Product.findByIdAndDelete(id)
    await Inventory.deleteOne({ productId: id })

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting product:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete product',
    })
  }
}

/**
 * GET /api/admin/products/:id
 * Get product detail by ID
 */
export const getAdminProductDetail = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('categoryId', 'name')
      .lean()
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' })
      return
    }
    res.status(200).json({
      success: true,
      data: product,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get product detail',
    })
  }
}

/**
 * POST /api/admin/products
 * Create new product with admin privileges
 * Auto-creates inventory for product and all variants
 * Calls productController.createProduct directly
 */
export const createAdminProduct = async (req: AdminRequest, res: Response): Promise<void> => {
  // Just delegate to productController.createProduct
  await productController.createProduct(req, res)
}

/**
 * PUT /api/admin/products/:id
 * Update product with admin privileges
 * Calls productController.updateProduct directly
 */
export const updateAdminProduct = async (req: AdminRequest, res: Response): Promise<void> => {
  // Just delegate to productController.updateProduct
  await productController.updateProduct(req, res)
}