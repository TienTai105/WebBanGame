import express from 'express'
import {
  getGenres,
  getGenreById,
  createGenre,
  updateGenre,
  deleteGenre,
} from '../controllers/genreController.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = express.Router()

// Public routes
router.get('/', getGenres)
router.get('/:id', getGenreById)

// Admin routes
router.post('/', protect, adminOnly, createGenre)
router.put('/:id', protect, adminOnly, updateGenre)
router.delete('/:id', protect, adminOnly, deleteGenre)

export default router
