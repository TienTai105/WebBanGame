import express, { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { staffOnly } from '../middleware/adminAuth.js'
import { PackingSlip } from '../models/PackingSlip.js'
import Order from '../models/Order.js'

const router: Router = express.Router()

// Middleware: check auth then staff/admin access
router.use(protect, staffOnly)

// GET: List all packing slips with status filter
router.get('/', async (req, res) => {
  try {
    const { status, skip = 0, limit = 20 } = req.query

    const filter: any = {}
    if (status && status !== 'all') {
      filter.status = status
    }

    const packingSlips = await PackingSlip.find(filter)
      .populate('orderId', 'orderCode totalPrice finalPrice paymentStatus')
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))

    // Ensure all slips have price data (fallback for old records)
    const dataWithPrices = packingSlips.map((slip: any) => {
      const slip_obj = slip.toObject() as any
      const orderId = slip_obj.orderId as any
      if (!slip_obj.totalPrice && orderId?.totalPrice) {
        slip_obj.totalPrice = orderId.totalPrice
      }
      if (!slip_obj.finalPrice && orderId?.finalPrice) {
        slip_obj.finalPrice = orderId.finalPrice
      }
      // Fallback if no finalPrice
      if (!slip_obj.finalPrice) {
        slip_obj.finalPrice = slip_obj.totalPrice || 0
      }
      return slip_obj
    })

    const total = await PackingSlip.countDocuments(filter)

    res.status(200).json({
      success: true,
      data: dataWithPrices,
      total,
      pages: Math.ceil(total / Number(limit)),
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Get packing slips failed',
    })
  }
})

// GET: Get packing slip by order ID
router.get('/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params

    const packingSlip = await PackingSlip.findOne({ orderId }).populate(
      'orderId',
      'orderCode totalPrice finalPrice paymentStatus'
    )

    if (!packingSlip) {
      return res.status(404).json({
        success: false,
        error: 'Packing slip not found',
      })
    }

    const slip_obj = packingSlip.toObject() as any
    const orderObj = slip_obj.orderId as any
    if (!slip_obj.totalPrice && orderObj?.totalPrice) {
      slip_obj.totalPrice = orderObj.totalPrice
    }
    if (!slip_obj.finalPrice && orderObj?.finalPrice) {
      slip_obj.finalPrice = orderObj.finalPrice
    }
    if (!slip_obj.finalPrice) {
      slip_obj.finalPrice = slip_obj.totalPrice || 0
    }

    res.status(200).json({
      success: true,
      data: slip_obj,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Get packing slip failed',
    })
  }
})

// GET: Get packing slip by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const packingSlip = await PackingSlip.findById(id).populate(
      'orderId',
      'orderCode totalPrice finalPrice paymentStatus'
    )

    if (!packingSlip) {
      return res.status(404).json({
        success: false,
        error: 'Packing slip not found',
      })
    }

    const slip_obj = packingSlip.toObject() as any
    const orderId = slip_obj.orderId as any
    if (!slip_obj.totalPrice && orderId?.totalPrice) {
      slip_obj.totalPrice = orderId.totalPrice
    }
    if (!slip_obj.finalPrice && orderId?.finalPrice) {
      slip_obj.finalPrice = orderId.finalPrice
    }
    if (!slip_obj.finalPrice) {
      slip_obj.finalPrice = slip_obj.totalPrice || 0
    }

    res.status(200).json({
      success: true,
      data: slip_obj,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Get packing slip failed',
    })
  }
})

// PUT: Update packing slip (edit notes, items)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { generalNotes, itemNotes, items } = req.body

    const packingSlip = await PackingSlip.findById(id)

    if (!packingSlip) {
      return res.status(404).json({
        success: false,
        error: 'Packing slip not found',
      })
    }

    // Only update if not printed or packing
    if (packingSlip.status === 'packing' || packingSlip.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot edit packing slip that is being packed or completed',
      })
    }

    if (generalNotes !== undefined) packingSlip.generalNotes = generalNotes
    if (itemNotes !== undefined) packingSlip.itemNotes = itemNotes
    if (items !== undefined) packingSlip.items = items

    await packingSlip.save()

    res.status(200).json({
      success: true,
      data: packingSlip,
      message: 'Packing slip updated',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Update packing slip failed',
    })
  }
})

// PUT: Mark as printed
router.put('/:id/print', async (req, res) => {
  try {
    const { id } = req.params

    const packingSlip = await PackingSlip.findById(id)

    if (!packingSlip) {
      return res.status(404).json({
        success: false,
        error: 'Packing slip not found',
      })
    }

    packingSlip.status = 'printed'
    packingSlip.printedAt = new Date()

    await packingSlip.save()

    res.status(200).json({
      success: true,
      data: packingSlip,
      message: 'Marked as printed',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Mark as printed failed',
    })
  }
})

// PUT: Mark as packing started
router.put('/:id/packing', async (req, res) => {
  try {
    const { id } = req.params

    const packingSlip = await PackingSlip.findById(id)

    if (!packingSlip) {
      return res.status(404).json({
        success: false,
        error: 'Packing slip not found',
      })
    }

    packingSlip.status = 'packing'
    packingSlip.packingStartedAt = new Date()

    await packingSlip.save()

    res.status(200).json({
      success: true,
      data: packingSlip,
      message: 'Marked as packing',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Mark as packing failed',
    })
  }
})

// PUT: Mark as completed
router.put('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params

    const packingSlip = await PackingSlip.findById(id)

    if (!packingSlip) {
      return res.status(404).json({
        success: false,
        error: 'Packing slip not found',
      })
    }

    packingSlip.status = 'completed'
    packingSlip.completedAt = new Date()

    await packingSlip.save()

    res.status(200).json({
      success: true,
      data: packingSlip,
      message: 'Marked as completed',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Mark as completed failed',
    })
  }
})

export default router
