import express, { Router, Request, Response } from 'express'
import multer, { StorageEngine } from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { asyncHandler, protect } from '../middleware/auth.js'
import { staffOnly } from '../middleware/adminAuth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = Router()

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../client/public/images')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Configure multer storage
const storage: StorageEngine = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => {
    cb(null, uploadsDir)
  },
  filename: (_req: any, file: any, cb: any) => {
    // Generate unique filename: Game-resident-evil-requiem-1234567890.png
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const originalName = file.originalname
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
    
    const ext = path.extname(originalName) || '.png'
    const nameWithoutExt = path.basename(originalName, ext)
    
    const filename = `${nameWithoutExt}-${timestamp}-${randomStr}${ext}`
    cb(null, filename)
  }
})

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
 * Upload multiple product images
 * Returns array of URLs: ['/images/filename.png', ...]
 */
router.post(
  '/upload',
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

    const imageUrls = files.map(file => ({
      url: `/images/${file.filename}`,
      filename: file.filename,
      size: file.size
    }))

    res.status(200).json({
      success: true,
      data: imageUrls,
      message: 'Images uploaded successfully'
    })
  })
)

export default router
