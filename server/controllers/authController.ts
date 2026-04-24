import { Request, Response, NextFunction } from 'express'
import User from '../models/User.js'
import AuditLog from '../models/AuditLog.js'
import TokenBlacklist from '../models/TokenBlacklist.js'
import jwt from 'jsonwebtoken'
import * as tokenUtils from '../utils/tokenUtils.js'
import { validatePassword, getPasswordRequirements } from '../utils/passwordValidator.js'

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

  // ✅ NEW: Validate password strength
  const passwordValidation = validatePassword(password)
  if (!passwordValidation.valid) {
    res.status(400).json({
      success: false,
      message: 'Password does not meet security requirements',
      errors: passwordValidation.errors,
      requirements: getPasswordRequirements(),
    })
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
  try {
    // ✅ Get access token from header to blacklist it
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer')) {
      const accessToken = authHeader.split(' ')[1]
      if (accessToken) {
        try {
          // Decode token to get expiration time
          const decoded = jwt.decode(accessToken) as any
          if (decoded && decoded.exp) {
            // Add token to blacklist with its expiration time
            await TokenBlacklist.create({
              token: accessToken,
              expiresAt: new Date(decoded.exp * 1000),
              userId: decoded._id,
              reason: 'logout',
            })
            console.log('✅ [LOGOUT] Access token blacklisted successfully')
          }
        } catch (error) {
          console.error('⚠️ [LOGOUT] Failed to blacklist token:', error)
          // Continue logout even if blacklist fails
        }
      }
    }
    
    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    })
    
    res.json({ success: true, message: 'Logout successful' })
  } catch (error: any) {
    console.error('❌ [LOGOUT] Error during logout:', error)
    res.status(500).json({ success: false, message: error.message })
  }
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

// ✅ NEW: Change password (for logged-in users)
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  const { currentPassword, newPassword, confirmPassword } = req.body
  const userId = (req as any).user?._id

  // Validation
  if (!currentPassword || !newPassword || !confirmPassword) {
    res.status(400).json({ success: false, message: 'All fields are required' })
    return
  }

  if (newPassword !== confirmPassword) {
    res.status(400).json({ success: false, message: 'New passwords do not match' })
    return
  }

  if (currentPassword === newPassword) {
    res.status(400).json({ success: false, message: 'New password must be different from current password' })
    return
  }

  // Validate new password strength
  const passwordValidation = validatePassword(newPassword)
  if (!passwordValidation.valid) {
    res.status(400).json({
      success: false,
      message: 'New password does not meet security requirements',
      errors: passwordValidation.errors,
      requirements: getPasswordRequirements(),
    })
    return
  }

  try {
    // Fetch user with password field
    const user = await User.findById(userId).select('+password')
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }

    // Verify current password matches
    const isPasswordValid = await user.matchPassword(currentPassword)
    if (!isPasswordValid) {
      // Log failed attempt
      await AuditLog.create({
        action: 'UPDATE',
        entity: 'User',
        entityId: user._id,
        userId: user._id,
        userEmail: user.email,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'failed',
        errorMessage: 'Current password incorrect',
        reason: 'Password change attempt with wrong current password',
      })
      res.status(401).json({ success: false, message: 'Current password is incorrect' })
      return
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword
    await user.save()

    // Log successful password change
    await AuditLog.create({
      action: 'UPDATE',
      entity: 'User',
      entityId: user._id,
      userId: user._id,
      userEmail: user.email,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success',
      reason: 'User changed password',
    })

    res.json({
      success: true,
      message: 'Password changed successfully',
    })
  } catch (error: any) {
    console.error('❌ [CHANGE_PASSWORD] Error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// ✅ NEW: Check if email exists (for registration form validation)
export const checkEmailExists = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body

  if (!email) {
    res.status(400).json({ success: false, message: 'Email is required' })
    return
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() })
    res.json({
      exists: !!user,
    })
  } catch (error: any) {
    console.error('❌ [CHECK_EMAIL] Error:', error)
    res.status(500).json({ exists: false })
  }
}

// ✅ NEW: Check if phone exists (for registration form validation)
export const checkPhoneExists = async (req: Request, res: Response): Promise<void> => {
  const { phone } = req.body

  if (!phone) {
    res.status(400).json({ success: false, message: 'Phone is required' })
    return
  }

  try {
    const user = await User.findOne({ phone: phone.trim() })
    res.json({
      exists: !!user,
    })
  } catch (error: any) {
    console.error('❌ [CHECK_PHONE] Error:', error)
    res.status(500).json({ exists: false })
  }
}
