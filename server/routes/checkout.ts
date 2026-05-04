import express from 'express'
import { createHold, releaseHold, extendHold } from '../controllers/holdController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.post('/hold', protect, createHold)
router.put('/hold/:holdId/extend', extendHold)  // ✅ No auth needed - holdId is unique identifier
router.post('/hold/:holdId/release', releaseHold)  // ✅ No auth needed - verify via holdId
router.delete('/hold/:holdId', protect, releaseHold)  // Keep for API calls with auth

export default router
