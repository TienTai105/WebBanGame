import express, { Router, Request, Response } from 'express'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import dotenv from 'dotenv'
import { asyncHandler, protect } from '../middleware/auth.js'
import { staffOnly } from '../middleware/adminAuth.js'

dotenv.config()

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const router = Router()

// Use memory storage since we're uploading to Cloudinary
const storage = multer.memoryStorage()

const fileFilter = (_req: any, file: any, cb: any) => {
  // Accept image files only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('Only image files are allowed'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
})

/**
 * POST /api/upload
 * Upload multiple product images to Cloudinary
 * Returns array of URLs from Cloudinary
 */
router.post(
  '/upload',
  (req: any, res: any, next: any) => {
    console.log('📤 Upload endpoint hit')
    console.log('🔑 Auth header:', req.headers.authorization ? 'EXISTS' : 'MISSING')
    next()
  },
  protect,
  staffOnly,
  upload.array('images', 10),
  asyncHandler(async (req: Request, res: Response) => {
    const files = (req as any).files as any[] | undefined
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      })
    }

    try {
      // Upload all files to Cloudinary in parallel
      const uploadPromises = files.map((file) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'web-ban-game/products',
              resource_type: 'auto',
              quality: 'auto',
              fetch_format: 'auto',
            },
            (error, result) => {
              if (error) {
                console.error('Cloudinary upload error:', error)
                reject(error)
              } else {
                resolve({
                  url: result?.secure_url,
                  publicId: result?.public_id,
                  filename: file.originalname,
                })
              }
            }
          )
          
          stream.end(file.buffer)
        })
      })

      const uploadedFiles = await Promise.all(uploadPromises)

      const imageUrls = uploadedFiles.map((file: any) => ({
        url: file.url,
        publicId: file.publicId,
        filename: file.filename,
      }))

      console.log('✅ Successfully uploaded', imageUrls.length, 'files to Cloudinary')

      res.status(200).json({
        success: true,
        data: imageUrls,
        message: 'Images uploaded successfully to Cloudinary'
      })
    } catch (err: any) {
      console.error('❌ Upload error:', err.message)
      res.status(500).json({
        success: false,
        message: 'Failed to upload images: ' + (err.message || 'Unknown error')
      })
    }
  })
)

export default router

