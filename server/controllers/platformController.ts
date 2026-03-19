import { Request, Response, NextFunction } from 'express'
import Platform from '../models/Platform.js'

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err: any) => next(err))
  }

// Get all platforms
export const getPlatforms = asyncHandler(async (req: Request, res: Response) => {
  const platforms = await Platform.find().sort({ createdAt: -1 })

  res.status(200).json({
    success: true,
    count: platforms.length,
    data: platforms,
  })
})

// Get platform by ID
export const getPlatformById = asyncHandler(async (req: Request, res: Response) => {
  const platform = await Platform.findById(req.params.id)

  if (!platform) {
    return res.status(404).json({
      success: false,
      message: 'Platform not found',
    })
  }

  res.status(200).json({
    success: true,
    data: platform,
  })
})

// Create platform (admin only)
export const createPlatform = asyncHandler(async (req: Request, res: Response) => {
  const { name, slug } = req.body

  if (!name || !slug) {
    return res.status(400).json({
      success: false,
      message: 'Name and slug are required',
    })
  }

  const platform = await Platform.create(req.body)

  res.status(201).json({
    success: true,
    data: platform,
  })
})

// Update platform (admin only)
export const updatePlatform = asyncHandler(async (req: Request, res: Response) => {
  const platform = await Platform.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  )

  if (!platform) {
    return res.status(404).json({
      success: false,
      message: 'Platform not found',
    })
  }

  res.status(200).json({
    success: true,
    data: platform,
  })
})

// Delete platform (admin only)
export const deletePlatform = asyncHandler(async (req: Request, res: Response) => {
  const platform = await Platform.findByIdAndDelete(req.params.id)

  if (!platform) {
    return res.status(404).json({
      success: false,
      message: 'Platform not found',
    })
  }

  res.status(200).json({
    success: true,
    message: 'Platform deleted',
  })
})
