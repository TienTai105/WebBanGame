import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import dotenv from 'dotenv'

dotenv.config()

interface AuthRequest extends Request {
  user?: {
    _id: string
    userId?: string
    email?: string
    role?: 'user' | 'customer' | 'staff' | 'admin'
  }
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  }

  // Make sure token exists
  if (!token) {
    console.log('❌ [PROTECT] No token found in request:', {
      endpoint: req.path,
      method: req.method,
      authHeader: req.headers.authorization ? '✓ exists' : '✗ missing',
      userAgent: req.get('user-agent'),
    })
    res.status(401).json({ success: false, message: 'Not authorized to access this route' })
    return
  }

  try {
    // Verify token
    console.log('🔍 [PROTECT] Verifying token...', {
      endpoint: req.path,
      tokenPreview: token.substring(0, 20) + '...',
    })
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any
    console.log('✅ [PROTECT] Token verified successfully:', {
      _id: decoded._id,
      email: decoded.email,
      role: decoded.role,
    })
    req.user = decoded

    // Update lastActivity silently (fire-and-forget, throttle to 1 min)
    const userId = decoded._id || decoded.userId
    if (userId) {
      const oneMinAgo = new Date(Date.now() - 60 * 1000)
      User.updateOne(
        { _id: userId, $or: [{ lastActivity: { $lt: oneMinAgo } }, { lastActivity: null }] },
        { $set: { lastActivity: new Date() } }
      ).exec().catch(() => {})
    }

    next()
  } catch (error: any) {
    console.error('❌ [PROTECT] Token verification failed:', {
      endpoint: req.path,
      errorType: error.name,
      errorMessage: error.message,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'N/A',
    })
    res.status(401).json({ success: false, message: 'Not authorized to access this route' })
  }
}

export const adminOnly = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Admin access required' })
    return
  }
  next()
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(err)

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0]
    res.status(400).json({
      success: false,
      message: `${field} already exists`,
    })
    return
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e: any) => e.message)
    res.status(400).json({
      success: false,
      message: (messages as string[]).join(', '),
    })
    return
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server error',
  })
}

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
