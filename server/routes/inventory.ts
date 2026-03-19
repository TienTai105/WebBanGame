import express from 'express'
import { checkStock, getProductInventory, getInventoryReport } from '../controllers/inventoryController.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = express.Router()

// Public: check stock for a product variant
router.get('/check-stock/:productId/:variantSku', checkStock)
router.get('/check-stock/:productId', checkStock)

// Public: get all variants stock for a product
router.get('/product/:productId', getProductInventory)

// Admin: inventory report
router.get('/report', protect, adminOnly, getInventoryReport)

export default router
