import express from 'express'
import { createHold, releaseHold } from '../controllers/holdController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.post('/hold', protect, createHold)
router.delete('/hold/:holdId', protect, releaseHold)

export default router
