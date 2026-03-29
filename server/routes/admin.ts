import { Router } from 'express'
import { asyncHandler, protect } from '../middleware/auth.js'
import { adminOnlyStrict, staffOnly, requireOTPVerification, requirePermission } from '../middleware/adminAuth.js'
import * as adminController from '../controllers/adminController.js'

const router = Router()

// ==================== PROTECTED ROUTES ====================
// All admin routes require authentication
router.use(protect)

// ==================== DASHBOARD ====================
// GET /api/admin/dashboard/stats - Get KPI data
router.get('/dashboard/stats', staffOnly, requirePermission('dashboard'), asyncHandler(adminController.getDashboardStats))

// ==================== PRODUCTS ====================
// GET /api/admin/products - Get all products with pagination and filtering
router.get('/products', staffOnly, requirePermission('products'), asyncHandler(adminController.getAdminProducts))
// POST /api/admin/products - Create new product
router.post('/products', staffOnly, requirePermission('products'), asyncHandler(adminController.createAdminProduct))
// GET /api/admin/products/:id - Get product detail
router.get('/products/:id', staffOnly, requirePermission('products'), asyncHandler(adminController.getAdminProductDetail))
// PUT /api/admin/products/:id - Update product
router.put('/products/:id', staffOnly, requirePermission('products'), asyncHandler(adminController.updateAdminProduct))
// DELETE /api/admin/products/:id - Delete a product (dangerous - requires OTP for staff)
router.delete('/products/:id', staffOnly, requirePermission('products'), requireOTPVerification, asyncHandler(adminController.deleteAdminProduct))

// ==================== OTP VERIFICATION ====================
// POST /api/admin/otp/generate - Generate OTP for action
router.post('/otp/generate', staffOnly, asyncHandler(adminController.generateOTP))

// POST /api/admin/otp/verify - Verify OTP code
router.post('/otp/verify', staffOnly, asyncHandler(adminController.verifyOTP))

// ==================== AUDIT LOGS ====================
// GET /api/admin/audit-logs - Get audit logs (admin only)
router.get('/audit-logs', adminOnlyStrict, asyncHandler(adminController.getAuditLogs))

// ==================== USER MANAGEMENT ====================
// GET /api/admin/users/stats - Get user statistics
router.get('/users/stats', adminOnlyStrict, asyncHandler(adminController.getUserStats))

// GET /api/admin/users - Get list of users
router.get('/users', adminOnlyStrict, asyncHandler(adminController.getAdminUsers))

// POST /api/admin/users - Create new user (ADMIN only)
router.post('/users', adminOnlyStrict, asyncHandler(adminController.createUser))

// PUT /api/admin/users/:id/role - Change user role (ADMIN only)
router.put('/users/:id/role', adminOnlyStrict, asyncHandler(adminController.changeUserRole))

// PUT /api/admin/users/:id/permissions - Update staff permissions (ADMIN only)
router.put('/users/:id/permissions', adminOnlyStrict, asyncHandler(adminController.updateUserPermissions))

// PUT /api/admin/users/:id/toggle-active - Toggle user active status
router.put('/users/:id/toggle-active', adminOnlyStrict, asyncHandler(adminController.toggleUserActive))

// POST /api/admin/users/:id/reset-password - Send password reset email (ADMIN only)
router.post('/users/:id/reset-password', adminOnlyStrict, asyncHandler(adminController.resetUserPassword))

export default router
