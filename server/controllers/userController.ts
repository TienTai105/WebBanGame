import { Request, Response } from 'express'
import User from '../models/User.js'

interface AuthRequest extends Request {
  user?: {
    _id: string
    userId?: string
    email?: string
    role?: string
  }
}

export const addShippingAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any)?._id
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' })
      return
    }

    const { name, street, city, district, ward, zipCode, isDefault } = req.body

    // Validation
    if (!name || !street || !city || !district || !ward) {
      res.status(400).json({ success: false, message: 'All fields are required' })
      return
    }

    const user = await User.findById(userId)
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }

    // If this is the first address or isDefault=true, set it as default
    const shouldBeDefault = isDefault || !user.shippingAddresses || user.shippingAddresses.length === 0

    // If setting as default, remove default from other addresses
    if (shouldBeDefault && user.shippingAddresses) {
      user.shippingAddresses.forEach(addr => {
        addr.isDefault = false
      })
    }

    // Add new address
    const newAddress = {
      name,
      street,
      city,
      district,
      ward,
      zipCode: zipCode || '',
      isDefault: shouldBeDefault,
    }

    if (!user.shippingAddresses) {
      user.shippingAddresses = []
    }

    user.shippingAddresses.push(newAddress as any)
    await user.save()

    res.status(201).json({
      success: true,
      data: { shippingAddresses: user.shippingAddresses },
      message: 'Address added successfully',
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const updateShippingAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any)?._id
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' })
      return
    }

    const { addressId } = req.params
    const { name, street, city, district, ward, zipCode, isDefault } = req.body

    const user = await User.findById(userId)
    if (!user || !user.shippingAddresses) {
      res.status(404).json({ success: false, message: 'User or address not found' })
      return
    }

    const addressIndex = user.shippingAddresses.findIndex(addr => (addr as any)._id?.toString() === addressId)
    if (addressIndex === -1) {
      res.status(404).json({ success: false, message: 'Address not found' })
      return
    }

    // If setting as default, remove default from other addresses
    if (isDefault) {
      user.shippingAddresses.forEach((addr, idx) => {
        addr.isDefault = idx === addressIndex
      })
    }

    // Update address
    user.shippingAddresses[addressIndex] = {
      ...user.shippingAddresses[addressIndex],
      name: name || user.shippingAddresses[addressIndex].name,
      street: street || user.shippingAddresses[addressIndex].street,
      city: city || user.shippingAddresses[addressIndex].city,
      district: district || user.shippingAddresses[addressIndex].district,
      ward: ward || user.shippingAddresses[addressIndex].ward,
      zipCode: zipCode !== undefined ? zipCode : user.shippingAddresses[addressIndex].zipCode,
      isDefault: isDefault !== undefined ? isDefault : user.shippingAddresses[addressIndex].isDefault,
    }

    await user.save()

    res.json({
      success: true,
      data: { shippingAddresses: user.shippingAddresses },
      message: 'Address updated successfully',
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const deleteShippingAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any)?._id
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' })
      return
    }

    const { addressId } = req.params

    const user = await User.findById(userId)
    if (!user || !user.shippingAddresses) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }

    const initialLength = user.shippingAddresses.length
    user.shippingAddresses = user.shippingAddresses.filter(addr => (addr as any)._id?.toString() !== addressId)

    if (user.shippingAddresses.length === initialLength) {
      res.status(404).json({ success: false, message: 'Address not found' })
      return
    }

    // If deleted address was default, set first address as default
    if (!user.shippingAddresses.some(addr => addr.isDefault) && user.shippingAddresses.length > 0) {
      user.shippingAddresses[0].isDefault = true
    }

    await user.save()

    res.json({
      success: true,
      data: { shippingAddresses: user.shippingAddresses },
      message: 'Address deleted successfully',
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getShippingAddresses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any)?._id
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' })
      return
    }

    const user = await User.findById(userId)
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }

    res.json({
      success: true,
      data: { shippingAddresses: user.shippingAddresses || [] },
      message: 'Addresses retrieved successfully',
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any)?._id
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' })
      return
    }

    const { name, phone, avatar } = req.body

    // Validation
    if (!name || !phone) {
      res.status(400).json({ success: false, message: 'Name and phone are required' })
      return
    }

    const user = await User.findById(userId)
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }

    // Update only allowed fields
    user.name = name.trim()
    user.phone = phone.trim()
    
    // Update avatar if provided
    if (avatar) {
      // Accept both base64 strings and URLs (http/https or cloudinary)
      const isBase64 = avatar.startsWith('data:image/')
      const isUrl = avatar.startsWith('http://') || avatar.startsWith('https://')
      
      if (!isBase64 && !isUrl) {
        res.status(400).json({ success: false, message: 'Invalid avatar format. Must be image URL or base64.' })
        return
      }
      user.avatar = avatar
    }

    await user.save()

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          emailVerified: user.emailVerified,
          role: user.role,
          shippingAddresses: user.shippingAddresses || [],
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
      message: 'Profile updated successfully',
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
}
