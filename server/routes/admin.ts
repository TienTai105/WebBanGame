import { Router } from 'express'
import { asyncHandler, protect } from '../middleware/auth.js'
import { adminOnlyStrict, staffOnly, requireOTPVerification } from '../middleware/adminAuth.js'
import * as adminController from '../controllers/adminController.js'

const router = Router()

// ==================== PROTECTED ROUTES ====================
// All admin routes require authentication
router.use(protect)

// ==================== DASHBOARD ====================
// GET /api/admin/dashboard/stats - Get KPI data
router.get('/dashboard/stats', staffOnly, asyncHandler(adminController.getDashboardStats))

// ==================== OTP VERIFICATION ====================
// POST /api/admin/otp/generate - Generate OTP for action
router.post('/otp/generate', asyncHandler(adminController.generateOTP))

// POST /api/admin/otp/verify - Verify OTP code
router.post('/otp/verify', asyncHandler(adminController.verifyOTP))

// ==================== AUDIT LOGS ====================
// GET /api/admin/audit-logs - Get audit logs
router.get('/audit-logs', adminOnlyStrict, asyncHandler(adminController.getAuditLogs))

// ==================== USER MANAGEMENT ====================
// GET /api/admin/users - Get list of admin/staff users
router.get('/users', adminOnlyStrict, asyncHandler(adminController.getAdminUsers))

// PUT /api/admin/users/:id/role - Change user role (ADMIN only)
router.put('/users/:id/role', adminOnlyStrict, asyncHandler(adminController.changeUserRole))

// POST /api/admin/users/:id/reset-password - Send password reset email (ADMIN only)
router.post('/users/:id/reset-password', adminOnlyStrict, asyncHandler(adminController.resetUserPassword))

export default router
