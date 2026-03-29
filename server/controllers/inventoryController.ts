import { Request, Response, NextFunction } from 'express'
import inventoryService from '../services/inventoryService.js'
import Inventory from '../models/Inventory.js'
import StockMovement from '../models/StockMovement.js'
import mongoose from 'mongoose'

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }

/**
 * GET /api/inventory/admin/all?page=1&limit=20&status=low|out|normal&search=
 * Admin: Get all inventory with pagination and product info
 */
export const getAllInventory = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt((req.query.page as string) || '1')
  const limit = parseInt((req.query.limit as string) || '20')
  const status = req.query.status as string
  const search = req.query.search as string

  const matchFilter: any = {}
  if (status === 'out') matchFilter.available = { $eq: 0 }
  else if (status === 'low') matchFilter.available = { $gt: 0, $lte: 5 }
  else if (status === 'normal') matchFilter.available = { $gt: 5 }

  const pipeline: any[] = [
    ...(Object.keys(matchFilter).length ? [{ $match: matchFilter }] : []),
    {
      $lookup: {
        from: 'products',
        localField: 'productId',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: { path: '$product', preserveNullAndEmptyArrays: false } },
  ]

  if (search?.trim()) {
    pipeline.push({
      $match: {
        $or: [
          { 'product.name': { $regex: search.trim(), $options: 'i' } },
          { variantSku: { $regex: search.trim(), $options: 'i' } },
        ],
      },
    })
  }

  // Count total
  const countPipeline = [...pipeline, { $count: 'total' }]
  const countResult = await Inventory.aggregate(countPipeline)
  const total = countResult[0]?.total || 0

  // Get paginated data
  pipeline.push(
    {
      $project: {
        productId: 1,
        variantSku: 1,
        available: 1,
        reserved: 1,
        sold: 1,
        damaged: 1,
        lastUpdated: 1,
        productName: '$product.name',
        productImage: { $arrayElemAt: ['$product.images', 0] },
        productSku: '$product.sku',
      },
    },
    { $sort: { available: 1, lastUpdated: -1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
  )

  const items = await Inventory.aggregate(pipeline)

  res.json({
    success: true,
    data: {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  })
})

/**
 * GET /api/inventory/admin/stats
 * Admin: Get inventory overview stats
 */
export const getInventoryStats = asyncHandler(async (_req: Request, res: Response) => {
  const [stats] = await Inventory.aggregate([
    {
      $group: {
        _id: null,
        totalItems: { $sum: 1 },
        totalAvailable: { $sum: '$available' },
        totalReserved: { $sum: '$reserved' },
        totalSold: { $sum: '$sold' },
        totalDamaged: { $sum: '$damaged' },
        outOfStock: { $sum: { $cond: [{ $eq: ['$available', 0] }, 1, 0] } },
        lowStock: { $sum: { $cond: [{ $and: [{ $gt: ['$available', 0] }, { $lte: ['$available', 5] }] }, 1, 0] } },
      },
    },
  ])

  res.json({
    success: true,
    data: stats || {
      totalItems: 0, totalAvailable: 0, totalReserved: 0,
      totalSold: 0, totalDamaged: 0, outOfStock: 0, lowStock: 0,
    },
  })
})

/**
 * GET /api/inventory/admin/movements?page=1&limit=20&type=IN|OUT|ADJUST...&productId=
 * Admin: Get stock movements with pagination
 */
export const getStockMovements = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt((req.query.page as string) || '1')
  const limit = parseInt((req.query.limit as string) || '20')
  const type = req.query.type as string
  const productId = req.query.productId as string

  const filter: any = {}
  if (type && type !== 'all') filter.type = type
  if (productId) filter.productId = new mongoose.Types.ObjectId(productId)

  const total = await StockMovement.countDocuments(filter)
  const movements = await StockMovement.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('productId', 'name sku')
    .populate('createdBy', 'name email')
    .lean()

  res.json({
    success: true,
    data: {
      movements,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  })
})

/**
 * GET /api/inventory/check-stock/:productId/:variantSku?quantity=1
 * Check if enough stock available for a given product variant
 */
export const checkStock = asyncHandler(async (req: Request, res: Response) => {
  const { productId, variantSku } = req.params
  const quantity = parseInt((req.query.quantity as string) || '1')

  if (!productId) {
    return res.status(400).json({ success: false, message: 'productId is required' })
  }

  const result = await inventoryService.checkStock(
    productId,
    variantSku === 'null' ? null : variantSku,
    quantity
  )

  res.json({ success: true, data: result })
})

/**
 * GET /api/inventory/product/:productId
 * Get all variant stock levels for a product
 */
export const getProductInventory = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params

  const variants = await inventoryService.getProductStock(productId)

  res.json({ success: true, data: variants })
})

/**
 * GET /api/inventory/report?status=low|out
 * Admin: Get inventory report (admin only)
 */
export const getInventoryReport = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query

  const matchFilter: any = {}
  if (status === 'out') {
    matchFilter.available = { $eq: 0 }
  } else if (status === 'low') {
    matchFilter.available = { $gt: 0, $lte: 5 }
  }

  const report = await Inventory.aggregate([
    ...(Object.keys(matchFilter).length ? [{ $match: matchFilter }] : []),
    {
      $lookup: {
        from: 'products',
        localField: 'productId',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: { path: '$product', preserveNullAndEmptyArrays: false } },
    {
      $project: {
        productId: 1,
        variantSku: 1,
        available: 1,
        reserved: 1,
        sold: 1,
        damaged: 1,
        productName: '$product.name',
        lastUpdated: 1,
      },
    },
    { $sort: { available: 1 } },
  ])

  res.json({ success: true, data: report })
})

/**
 * PUT /api/admin/inventory/:productId/:variantSku
 * Admin: Update inventory stock (manual adjustment)
 * Body: { available?, reserved?, damaged?, reason }
 */
export const updateInventory = asyncHandler(async (req: Request, res: Response) => {
  const { productId, variantSku } = req.params
  const { available, reserved, damaged, reason = 'Manual adjustment' } = req.body

  if (!productId || variantSku === undefined) {
    return res.status(400).json({ 
      success: false, 
      message: 'productId and variantSku are required' 
    })
  }

  // Find existing inventory
  let existingInventory = await Inventory.findOne({ 
    productId, 
    variantSku: variantSku === 'null' ? null : variantSku 
  })

  // If inventory doesn't exist, create it (auto-create for new variants)
  if (!existingInventory) {
    existingInventory = await Inventory.create({
      productId,
      variantSku: variantSku === 'null' ? null : variantSku,
      available: available || 0,
      reserved: reserved || 0,
      sold: 0,
      damaged: damaged || 0,
    })
    
    return res.status(201).json({ 
      success: true, 
      data: existingInventory,
      message: 'Inventory created and updated successfully' 
    })
  }

  // Calculate changes
  const changes: any = {
    lastUpdated: new Date()
  }
  
  let changeReason = reason
  
  if (available !== undefined && available !== existingInventory.available) {
    const diff = available - existingInventory.available
    changes.available = available
    changeReason = `${reason} (Available: ${diff > 0 ? '+' : ''}${diff})`
  }
  
  if (reserved !== undefined && reserved !== existingInventory.reserved) {
    changes.reserved = reserved
  }
  
  if (damaged !== undefined && damaged !== existingInventory.damaged) {
    changes.damaged = damaged
  }

  // Update inventory
  const updatedInventory = await Inventory.findByIdAndUpdate(
    existingInventory._id,
    { $set: changes },
    { new: true }
  )

  // Log stock movement if available changed
  if (available !== undefined && available !== existingInventory.available) {
    const diff = available - existingInventory.available
    
    await StockMovement.create({
      inventoryId: existingInventory._id,
      productId: new mongoose.Types.ObjectId(productId),
      variantSku: variantSku === 'null' ? null : variantSku,
      type: diff > 0 ? 'IN' : 'OUT',
      quantity: Math.abs(diff),
      reason: changeReason,
      reference: { type: 'Manual', id: 'admin-adjustment' },
      notes: `Admin manually ${diff > 0 ? 'added' : 'removed'} ${Math.abs(diff)} units`
    })
  }

  res.json({ 
    success: true, 
    data: updatedInventory,
    message: 'Inventory updated successfully' 
  })
})
