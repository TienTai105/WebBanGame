import express from 'express'
import {
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
} from '../controllers/brandController.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = express.Router()

// Public routes
router.get('/', getBrands)
router.get('/:id', getBrandById)

// Admin routes
router.post('/', protect, adminOnly, createBrand)
router.put('/:id', protect, adminOnly, updateBrand)
router.delete('/:id', protect, adminOnly, deleteBrand)

export default router
