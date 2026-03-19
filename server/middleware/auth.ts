import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

interface AuthRequest extends Request {
  user?: {
    _id: string
    userId?: string
    email?: string
    role?: 'user' | 'admin'
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
    console.log('❌ No token found in headers:', req.headers.authorization)
    res.status(401).json({ success: false, message: 'Not authorized to access this route' })
    return
  }

  try {
    // Verify token
    console.log('🔍 Verifying token:', token.substring(0, 20) + '...')
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any
    console.log('✅ Token verified, payload:', {
      _id: decoded._id,
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    })
    req.user = decoded
    next()
  } catch (error: any) {
    console.log('❌ Token verification failed:', error.message)
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
