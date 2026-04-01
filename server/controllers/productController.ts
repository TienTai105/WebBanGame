import { Request, Response } from 'express'
import Product from '../models/Product.js'
import Inventory from '../models/Inventory.js'

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 12, category, search, brand, platforms, minPrice, maxPrice, sort = 'newest', hasDiscount, isNew, isBestseller } = req.query
    const skip = ((Number(page) - 1) * Number(limit)) as number

    const filter: any = { isActive: true }

    // Category filter - fix field name from category to categoryId
    if (category) {
      filter.categoryId = category
    }

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }

    // Brand filter (single or multiple)
    if (brand) {
      const brandArray = Array.isArray(brand) ? brand : [brand]
      filter.brand = { $in: brandArray }
    }

    // Platform filter (single or multiple)
    if (platforms) {
      const platformArray = Array.isArray(platforms) ? platforms : [platforms]
      filter.platforms = { $in: platformArray }
    }

    // Sale filter - products with discount > 0
    if (hasDiscount === 'true') {
      filter.discount = { $gt: 0 }
    }

    // New products filter - created within last 30 days
    if (isNew === 'true') {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      filter.createdAt = { $gte: thirtyDaysAgo }
    }

    // Bestseller filter - products with sales > 3000
    if (isBestseller === 'true') {
      filter.soldCount = { $gte: 3000 }
    }

    // Price range filter - handle both finalPrice and price fields with $or
    if (minPrice || maxPrice) {
      const priceFilter: any = {}
      if (minPrice) {
        priceFilter.$gte = Number(minPrice)
      }
      if (maxPrice) {
        priceFilter.$lte = Number(maxPrice)
      }
      // Match products with finalPrice OR price field
      filter.$or = [
        { finalPrice: priceFilter },
        { price: priceFilter }
      ]
    }

    // Determine sort order
    let sortOrder: any = { createdAt: -1 } // Default: newest
    switch (sort) {
      case 'priceAsc':
        sortOrder = { finalPrice: 1 }
        break
      case 'priceDesc':
        sortOrder = { finalPrice: -1 }
        break
      case 'bestSellers':
        sortOrder = { soldCount: -1, createdAt: -1 }
        break
      case 'trending':
        sortOrder = { views: -1, createdAt: -1 }
        break
      case 'newest':
      default:
        sortOrder = { createdAt: -1 }
    }

    const products = await Product.find(filter)
      .populate('categoryId', 'name')
      .populate('brand', 'name')
      .populate('platforms', 'name')
      .sort(sortOrder)
      .skip(skip)
      .limit(Number(limit))

    const total = await Product.countDocuments(filter)

    res.json({
      success: true,
      data: {
        products,
        total,
        page: Number(page),
        limit: Number(limit),
      },
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const product = await Product.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true }).populate('categoryId', 'name')

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' })
      return
    }

    res.json({ success: true, data: product })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getTrendingProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 10 } = req.query

    const products = await Product.find({ isActive: true })
      .populate('categoryId', 'name')
      .sort({ views: -1, createdAt: -1 })
      .limit(Number(limit))

    res.json({
      success: true,
      data: {
        products,
        total: products.length,
        limit: Number(limit),
      },
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getBestSellers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 10 } = req.query

    const products = await Product.find({ isActive: true })
      .populate('categoryId', 'name')
      .sort({ soldCount: -1, createdAt: -1 })
      .limit(Number(limit))

    res.json({
      success: true,
      data: {
        products,
        total: products.length,
        limit: Number(limit),
      },
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getProductsByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.params
    const { limit = 10 } = req.query

    const products = await Product.find({ category, isActive: true })
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 })
      .limit(Number(limit))

    res.json({
      success: true,
      data: {
        products,
        total: products.length,
        category,
        limit: Number(limit),
      },
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getProductsByTag = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tag } = req.params
    const { limit = 10, page = 1 } = req.query
    const skip = ((Number(page) - 1) * Number(limit)) as number

    // Case-insensitive tag search
    const products = await Product.find({ 
      tags: { $regex: `^${tag}$`, $options: 'i' }, 
      isActive: true 
    })
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))

    const total = await Product.countDocuments({ 
      tags: { $regex: `^${tag}$`, $options: 'i' }, 
      isActive: true 
    })

    res.json({
      success: true,
      data: {
        products,
        total,
        page: Number(page),
        limit: Number(limit),
        tag,
      },
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, price, categoryId, sku, variants, stock } = req.body

    // Check for missing required fields (use !== undefined for proper null/undefined check, not falsy check)
    if (
      !name?.trim() || 
      !description?.trim() || 
      price === null || 
      price === undefined || 
      !categoryId?.trim() || 
      !sku?.trim()
    ) {
      res.status(400).json({ success: false, message: 'Missing required fields' })
      return
    }

    // Auto-generate slug from name if not provided
    const providedData = {
      ...req.body,
      slug: req.body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    }

    const product = await Product.create(providedData)

    // Auto-create inventory entry for product
    // If product has variants, create inventory for each variant
    if (variants && Array.isArray(variants) && variants.length > 0) {
      // Create inventory entry for each variant
      const inventoryEntries = variants.map((variant: any) => ({
        productId: product._id,
        variantSku: variant.sku || `${product.sku}-${variant.name}`,
        available: variant.available || 0,
        reserved: 0,
        sold: 0,
        damaged: 0,
      }))
      await Inventory.insertMany(inventoryEntries)
    } else {
      // Create single inventory entry for product without variants
      // Use product SKU as variantSku for easier querying
      await Inventory.create({
        productId: product._id,
        variantSku: product.sku,
        available: stock || 0,
        reserved: 0,
        sold: 0,
        damaged: 0,
      })
    }

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully',
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { variants, stock, name } = req.body
    
    // Auto-generate slug from name if name is being updated but slug is not provided
    const updateData = { ...req.body }
    if (name && !req.body.slug) {
      updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    }
    
    const product = await Product.findByIdAndUpdate(id, updateData, { new: true })

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' })
      return
    }

    // Update base product inventory if stock is provided
    if (stock !== undefined) {
      const baseInventory = await Inventory.findOne({
        productId: product._id,
        $or: [{ variantSku: null }, { variantSku: { $exists: false } }]
      })
      
      if (baseInventory) {
        baseInventory.available = stock
        await baseInventory.save()
      } else {
        // Create base inventory if it doesn't exist
        await Inventory.create({
          productId: product._id,
          available: stock,
          reserved: 0,
          sold: 0,
          damaged: 0,
        })
      }
    }

    // Auto-create inventory for new variants if they don't have inventory yet
    if (variants && Array.isArray(variants) && variants.length > 0) {
      for (const variant of variants) {
        const variantSku = variant.sku || `${product.sku}-${variant.name}`
        
        // Check if inventory already exists for this variant
        const existingInventory = await Inventory.findOne({
          productId: product._id,
          variantSku: variantSku
        })
        
        // Create inventory only if it doesn't exist
        if (!existingInventory) {
          await Inventory.create({
            productId: product._id,
            variantSku: variantSku,
            available: variant.available || 0,
            reserved: 0,
            sold: 0,
            damaged: 0,
          })
        }
      }
    }

    res.json({ success: true, data: product, message: 'Product updated successfully' })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const product = await Product.findByIdAndUpdate(id, { isActive: false }, { new: true })

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' })
      return
    }

    res.json({ success: true, data: product, message: 'Product deleted successfully' })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
}
