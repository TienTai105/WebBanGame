import { Request, Response } from 'express'
import Category from '../models/Category.js'

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Category.find().sort({ level: 1, name: 1 })

    res.json({
      success: true,
      data: categories,
      message: 'Categories retrieved successfully',
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const category = await Category.findById(id)

    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' })
      return
    }

    res.json({ success: true, data: category })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getCategoriesByLevel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { level } = req.params
    const categories = await Category.find({ level: Number(level) }).sort({ name: 1 })

    res.json({
      success: true,
      data: categories,
      message: `Categories at level ${level} retrieved successfully`,
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, slug, parentId, level } = req.body

    if (!name || !slug) {
      res.status(400).json({ success: false, message: 'Name and slug are required' })
      return
    }

    // Check if slug already exists
    const existing = await Category.findOne({ slug })
    if (existing) {
      res.status(400).json({ success: false, message: 'Slug already exists' })
      return
    }

    const category = await Category.create({
      name,
      slug: slug.toLowerCase(),
      parentId: parentId || null,
      level: level || 0,
    })

    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully',
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { name, slug, parentId, level } = req.body

    // Check if slug already exists (and not same as current)
    if (slug) {
      const existing = await Category.findOne({ slug, _id: { $ne: id } })
      if (existing) {
        res.status(400).json({ success: false, message: 'Slug already exists' })
        return
      }
    }

    const category = await Category.findByIdAndUpdate(
      id,
      {
        ...(name && { name }),
        ...(slug && { slug: slug.toLowerCase() }),
        ...(parentId !== undefined && { parentId: parentId || null }),
        ...(level !== undefined && { level }),
      },
      { new: true }
    )

    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' })
      return
    }

    res.json({
      success: true,
      data: category,
      message: 'Category updated successfully',
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const category = await Category.findByIdAndDelete(id)

    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' })
      return
    }

    res.json({
      success: true,
      data: category,
      message: 'Category deleted successfully',
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
}
