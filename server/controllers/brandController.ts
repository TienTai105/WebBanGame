import { Request, Response, NextFunction } from 'express'
import Brand from '../models/Brand.js'

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err: any) => next(err))
  }

// Get all brands
export const getBrands = asyncHandler(async (req: Request, res: Response) => {
  const brands = await Brand.find().sort({ createdAt: -1 })

  res.status(200).json({
    success: true,
    count: brands.length,
    data: brands,
  })
})

// Get brand by ID
export const getBrandById = asyncHandler(async (req: Request, res: Response) => {
  const brand = await Brand.findById(req.params.id)

  if (!brand) {
    return res.status(404).json({
      success: false,
      message: 'Brand not found',
    })
  }

  res.status(200).json({
    success: true,
    data: brand,
  })
})

// Create brand (admin only)
export const createBrand = asyncHandler(async (req: Request, res: Response) => {
  const { name, slug } = req.body

  if (!name || !slug) {
    return res.status(400).json({
      success: false,
      message: 'Name and slug are required',
    })
  }

  const brand = await Brand.create(req.body)

  res.status(201).json({
    success: true,
    data: brand,
  })
})

// Update brand (admin only)
export const updateBrand = asyncHandler(async (req: Request, res: Response) => {
  const brand = await Brand.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  )

  if (!brand) {
    return res.status(404).json({
      success: false,
      message: 'Brand not found',
    })
  }

  res.status(200).json({
    success: true,
    data: brand,
  })
})

// Delete brand (admin only)
export const deleteBrand = asyncHandler(async (req: Request, res: Response) => {
  const brand = await Brand.findByIdAndDelete(req.params.id)

  if (!brand) {
    return res.status(404).json({
      success: false,
      message: 'Brand not found',
    })
  }

  res.status(200).json({
    success: true,
    message: 'Brand deleted',
  })
})
