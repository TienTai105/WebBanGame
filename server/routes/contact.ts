import { Router } from 'express'
import { submitContact, getAllContacts, getContactStats, updateContactStatus, deleteContact } from '../controllers/contactController.js'
import { protect } from '../middleware/auth.js'
import { staffOnly, requirePermission, requireOTPVerification } from '../middleware/adminAuth.js'

const router = Router()

// Public: submit contact form
router.post('/', submitContact)

// Admin/Staff routes (require auth + contacts permission)
router.get('/admin/all', protect, staffOnly, requirePermission('contacts'), getAllContacts)
router.get('/admin/stats', protect, staffOnly, requirePermission('contacts'), getContactStats)
router.patch('/admin/:id/status', protect, staffOnly, requirePermission('contacts'), updateContactStatus)
router.delete('/admin/:id', protect, staffOnly, requirePermission('contacts'), requireOTPVerification, deleteContact)

export default router
