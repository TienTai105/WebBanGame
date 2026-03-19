import { Request, Response, NextFunction } from 'express'
import Genre from '../models/Genre.js'

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err: any) => next(err))
  }

// Get all genres
export const getGenres = asyncHandler(async (req: Request, res: Response) => {
  const genres = await Genre.find().sort({ createdAt: -1 })

  res.status(200).json({
    success: true,
    count: genres.length,
    data: genres,
  })
})

// Get genre by ID
export const getGenreById = asyncHandler(async (req: Request, res: Response) => {
  const genre = await Genre.findById(req.params.id)

  if (!genre) {
    return res.status(404).json({
      success: false,
      message: 'Genre not found',
    })
  }

  res.status(200).json({
    success: true,
    data: genre,
  })
})

// Create genre (admin only)
export const createGenre = asyncHandler(async (req: Request, res: Response) => {
  const { name, slug } = req.body

  if (!name || !slug) {
    return res.status(400).json({
      success: false,
      message: 'Name and slug are required',
    })
  }

  const genre = await Genre.create(req.body)

  res.status(201).json({
    success: true,
    data: genre,
  })
})

// Update genre (admin only)
export const updateGenre = asyncHandler(async (req: Request, res: Response) => {
  const genre = await Genre.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  )

  if (!genre) {
    return res.status(404).json({
      success: false,
      message: 'Genre not found',
    })
  }

  res.status(200).json({
    success: true,
    data: genre,
  })
})

// Delete genre (admin only)
export const deleteGenre = asyncHandler(async (req: Request, res: Response) => {
  const genre = await Genre.findByIdAndDelete(req.params.id)

  if (!genre) {
    return res.status(404).json({
      success: false,
      message: 'Genre not found',
    })
  }

  res.status(200).json({
    success: true,
    message: 'Genre deleted',
  })
})
