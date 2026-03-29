import express from 'express'
import { checkStock, getProductInventory, getInventoryReport, updateInventory, getAllInventory, getInventoryStats, getStockMovements } from '../controllers/inventoryController.js'
import { protect } from '../middleware/auth.js'
import { staffOnly, requirePermission, requireOTPVerification } from '../middleware/adminAuth.js'

const router = express.Router()

// Public: check stock for a product variant
router.get('/check-stock/:productId/:variantSku', checkStock)
router.get('/check-stock/:productId', checkStock)

// Public: get all variants stock for a product
router.get('/product/:productId', getProductInventory)

// Admin: inventory list with pagination
router.get('/admin/all', protect, staffOnly, requirePermission('inventory'), getAllInventory)

// Admin: inventory stats
router.get('/admin/stats', protect, staffOnly, requirePermission('inventory'), getInventoryStats)

// Admin: stock movements
router.get('/admin/movements', protect, staffOnly, requirePermission('inventory'), getStockMovements)

// Admin: inventory report (legacy)
router.get('/report', protect, staffOnly, requirePermission('inventory'), getInventoryReport)

// Admin: update inventory (manual adjustment) — requires OTP
router.put('/:productId/:variantSku', protect, staffOnly, requirePermission('inventory'), requireOTPVerification, updateInventory)

export default router
