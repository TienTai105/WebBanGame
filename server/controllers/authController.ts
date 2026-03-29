import { Request, Response, NextFunction } from 'express'
import User from '../models/User.js'
import AuditLog from '../models/AuditLog.js'
import * as tokenUtils from '../utils/tokenUtils.js'

const generateTokens = async (user: { _id: string; email?: string; role?: string }) => {
  const accessToken = tokenUtils.generateAccessToken(user)
  const refreshToken = tokenUtils.generateRefreshToken(user._id)
  return { accessToken, refreshToken }
}

export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, phone, password, confirmPassword } = req.body

  // Validation
  if (!name || !email || !phone || !password || !confirmPassword) {
    res.status(400).json({ success: false, message: 'All fields are required' })
    return
  }

  if (password !== confirmPassword) {
    res.status(400).json({ success: false, message: 'Passwords do not match' })
    return
  }

  try {
    // Check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      res.status(400).json({ success: false, message: 'Email already registered' })
      return
    }

    // Create user
    const user = await User.create({ name, email, phone, password })
    const { accessToken, refreshToken } = await generateTokens({
      _id: user._id as string,
      email: user.email,
      role: user.role,
    })

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    res.status(201).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          phone: user.phone,
          avatar: user.avatar,
          role: user.role,
          shippingAddresses: user.shippingAddresses || [],
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        accessToken,
      },
      message: 'Registration successful',
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ success: false, message: 'Email and password are required' })
    return
  }

  try {
    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials' })
      return
    }

    const isPasswordValid = await user.matchPassword(password)
    if (!isPasswordValid) {
      // Log failed login attempt (admin/staff only)
      if (user.role === 'admin' || user.role === 'staff') {
        await AuditLog.create({
          action: 'LOGIN',
          entity: 'User',
          entityId: user._id,
          userId: user._id,
          userEmail: user.email,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          status: 'failed',
          errorMessage: 'Invalid password',
        })
      }
      res.status(401).json({ success: false, message: 'Invalid credentials' })
      return
    }

    // Update lastLogin
    user.lastLogin = new Date()
    await user.save()

    // Log successful login (admin/staff only)
    if (user.role === 'admin' || user.role === 'staff') {
      await AuditLog.create({
        action: 'LOGIN',
        entity: 'User',
        entityId: user._id,
        userId: user._id,
        userEmail: user.email,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'success',
      })
    }

    const { accessToken, refreshToken } = await generateTokens({
      _id: user._id as string,
      email: user.email,
      role: user.role,
    })

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          phone: user.phone,
          avatar: user.avatar,
          role: user.role,
          permissions: user.role === 'staff' ? user.permissions : undefined,
          lastLogin: user.lastLogin,
          shippingAddresses: user.shippingAddresses || [],
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        accessToken,
      },
      message: 'Login successful',
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken
    if (!refreshToken) {
      res.status(401).json({ success: false, message: 'Refresh token not found' })
      return
    }

    const decoded = tokenUtils.verifyRefreshToken(refreshToken)
    if (!decoded) {
      res.status(401).json({ success: false, message: 'Invalid refresh token' })
      return
    }

    // Fetch user to get role
    const user = await User.findById(decoded.userId)
    if (!user) {
      res.status(401).json({ success: false, message: 'User not found' })
      return
    }

    const newAccessToken = tokenUtils.generateAccessToken({
      _id: user._id as string,
      email: user.email,
      role: user.role,
    })

    res.json({
      success: true,
      data: { accessToken: newAccessToken },
      message: 'Token refreshed',
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const logout = async (req: Request, res: Response): Promise<void> => {
  res.clearCookie('refreshToken')
  res.json({ success: true, message: 'Logout successful' })
}

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById((req as any).user._id)
    res.json({
      success: true,
      data: {
        user: {
          _id: user?._id,
          name: user?.name,
          email: user?.email,
          emailVerified: user?.emailVerified,
          phone: user?.phone,
          avatar: user?.avatar,
          role: user?.role,
          permissions: user?.role === 'staff' ? user?.permissions : undefined,
          shippingAddresses: user?.shippingAddresses || [],
          createdAt: user?.createdAt,
          updatedAt: user?.updatedAt,
        },
      },
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
}
