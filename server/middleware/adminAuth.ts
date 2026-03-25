import { Request, Response, NextFunction } from 'express'
import OTPVerification from '../models/OTPVerification.js'

interface AdminRequest extends Request {
  user?: {
    _id: string
    email?: string
    role?: 'customer' | 'staff' | 'admin'
  }
  skipOTPCheck?: boolean // Flag to skip OTP check for certain actions
}

/**
 * Middleware to check if user is STAFF with OTP verification
 * For sensitive operations, STAFF users need to provide OTP
 */
export const staffOnly = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (req.user?.role !== 'staff' && req.user?.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Staff access required' })
    return
  }
  next()
}

/**
 * Middleware to check if user is ADMIN
 */
export const adminOnlyStrict = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Admin-only access required' })
    return
  }
  next()
}

/**
 * Middleware to verify OTP for sensitive STAFF operations
 * This middleware should be used on routes that require OTP verification
 */
export const requireOTPVerification = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Skip OTP check for admins (only staff needs OTP)
  if (req.user?.role === 'admin' || req.skipOTPCheck) {
    next()
    return
  }

  const { otpToken } = req.headers

  if (!otpToken) {
    res.status(400).json({
      success: false,
      message: 'OTP verification required. Please verify OTP first.',
      code: 'OTP_REQUIRED',
    })
    return
  }

  try {
    const otpRecord = await OTPVerification.findById(otpToken)

    if (!otpRecord) {
      res.status(400).json({
        success: false,
        message: 'OTP verification expired or invalid',
      })
      return
    }

    // Check if OTP is verified
    if (!otpRecord.verified) {
      res.status(400).json({
        success: false,
        message: 'OTP not verified',
      })
      return
    }

    // Check if OTP has expired
    if (new Date() > otpRecord.expiresAt) {
      await OTPVerification.deleteOne({ _id: otpToken })
      res.status(400).json({
        success: false,
        message: 'OTP has expired',
      })
      return
    }

    // Check if user ID matches
    if (otpRecord.userId.toString() !== req.user?._id) {
      res.status(403).json({
        success: false,
        message: 'OTP belongs to a different user',
      })
      return
    }

    // Attach OTP record to request
    ;(req as any).otpRecord = otpRecord

    next()
  } catch (error) {
    console.error('OTP verification error:', error)
    res.status(500).json({
      success: false,
      message: 'Error verifying OTP',
    })
  }
}

/**
 * Check if action is permission-sensitive (requires OTP for staff)
 */
export const isStaffSensitiveAction = (action: string): boolean => {
  const sensitiveActions = [
    'EDIT_PRODUCT',
    'DELETE_PRODUCT',
    'EDIT_ORDER',
    'REFUND_ORDER',
    'CHANGE_ROLE',
    'DELETE_USER',
    'UPDATE_SETTINGS',
    'DELETE_NEWS',
  ]
  return sensitiveActions.includes(action)
}
