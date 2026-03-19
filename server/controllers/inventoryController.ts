import { Request, Response, NextFunction } from 'express'
import inventoryService from '../services/inventoryService.js'
import Inventory from '../models/Inventory.js'

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }

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
