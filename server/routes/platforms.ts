import express from 'express'
import {
  getPlatforms,
  getPlatformById,
  createPlatform,
  updatePlatform,
  deletePlatform,
} from '../controllers/platformController.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = express.Router()

// Public routes
router.get('/', getPlatforms)
router.get('/:id', getPlatformById)

// Admin routes
router.post('/', protect, adminOnly, createPlatform)
router.put('/:id', protect, adminOnly, updatePlatform)
router.delete('/:id', protect, adminOnly, deletePlatform)

export default router
