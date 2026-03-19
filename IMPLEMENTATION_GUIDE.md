# Inventory Management - Step-by-Step Implementation Guide

> Start with **Phase 1** code snippets, test locally, then move to Phase 2

---

## Phase 1: Create Inventory Service Layer

### Step 1.1: Create `inventoryService.ts`

**File:** `server/services/inventoryService.ts`

```typescript
import Inventory from '../models/Inventory';
import StockMovement from '../models/StockMovement';
import { Types } from 'mongoose';

interface StockLevels {
  available: number;
  reserved: number;
  sold: number;
  damaged: number;
  total: number;
}

class InventoryService {
  
  /**
   * Check if enough stock available
   * @returns { available: number, canBuy: boolean }
   */
  async checkStock(productId: string, variantSku: string, quantity: number) {
    try {
      const inventory = await Inventory.findOne({ 
        productId: new Types.ObjectId(productId), 
        variantSku 
      });

      if (!inventory) {
        return { available: 0, canBuy: false };
      }

      const canBuy = inventory.available >= quantity;
      return { 
        available: inventory.available, 
        reserved: inventory.reserved,
        canBuy 
      };
    } catch (error) {
      console.error('❌ Error checking stock:', error);
      throw error;
    }
  }

  /**
   * Get current stock levels for a variant
   */
  async getStockLevels(productId: string, variantSku: string): Promise<StockLevels> {
    try {
      const inventory = await Inventory.findOne({ 
        productId: new Types.ObjectId(productId), 
        variantSku 
      });

      if (!inventory) {
        return {
          available: 0,
          reserved: 0,
          sold: 0,
          damaged: 0,
          total: 0
        };
      }

      return {
        available: inventory.available,
        reserved: inventory.reserved,
        sold: inventory.sold,
        damaged: inventory.damaged,
        total: inventory.available + inventory.reserved + inventory.sold + inventory.damaged
      };
    } catch (error) {
      console.error('❌ Error getting stock levels:', error);
      throw error;
    }
  }

  /**
   * Reserve stock when user starts checkout
   * @returns reservation record with expiresAt
   */
  async reserveStock(
    productId: string,
    variantSku: string,
    quantity: number,
    orderId?: string
  ) {
    try {
      // Check stock exists
      let inventory = await Inventory.findOne({ 
        productId: new Types.ObjectId(productId), 
        variantSku 
      });

      // Create if not exists (shouldn't happen, but safety measure)
      if (!inventory) {
        inventory = await Inventory.create({
          productId: new Types.ObjectId(productId),
          variantSku,
          available: 0,
          reserved: 0,
          sold: 0,
          damaged: 0
        });
      }

      // Check if enough available
      if (inventory.available < quantity) {
        throw new Error(
          `Insufficient stock. Available: ${inventory.available}, Requested: ${quantity}`
        );
      }

      // Reserve stock atomically
      const updated = await Inventory.findByIdAndUpdate(
        inventory._id,
        {
          $inc: { 
            available: -quantity,
            reserved: +quantity
          },
          $set: { lastUpdated: new Date() }
        },
        { new: true }
      );

      // Log in StockMovement
      await StockMovement.create({
        inventoryId: inventory._id,
        productId: new Types.ObjectId(productId),
        variantSku,
        quantity,
        type: 'RESERVED',
        reference: {
          type: orderId ? 'Order' : 'CartHold',
          id: orderId ? new Types.ObjectId(orderId) : null
        },
        reason: 'User initiated checkout',
        notes: `Reserved for order: ${orderId || 'temp cart hold'}`
      });

      return {
        inventoryId: inventory._id,
        reserved: quantity,
        reservedAt: new Date(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins default
        message: `✅ Reserved ${quantity} units`
      };
    } catch (error) {
      console.error('❌ Error reserving stock:', error);
      throw error;
    }
  }

  /**
   * Confirm order - move reserved to sold
   */
  async confirmOrderStock(orderId: string, orderItems: any[]) {
    try {
      for (const item of orderItems) {
        let inventory = await Inventory.findOne({
          productId: item.productId,
          variantSku: item.variantSku
        });

        if (!inventory) {
          throw new Error(
            `Inventory not found for ${item.variantSku}`
          );
        }

        // Check if already reserved (safety check)
        if (inventory.reserved < item.quantity) {
          throw new Error(
            `Not enough reserved stock for ${item.variantSku}. Reserved: ${inventory.reserved}, Need: ${item.quantity}`
          );
        }

        // Move reserved → sold
        await Inventory.findByIdAndUpdate(
          inventory._id,
          {
            $inc: {
              reserved: -item.quantity,
              sold: +item.quantity
            },
            $set: { lastUpdated: new Date() }
          }
        );

        // Log in StockMovement
        await StockMovement.create({
          inventoryId: inventory._id,
          productId: item.productId,
          variantSku: item.variantSku,
          quantity: item.quantity,
          type: 'OUT',
          reference: {
            type: 'Order',
            id: new Types.ObjectId(orderId)
          },
          reason: 'Order confirmed - stock sold',
          notes: `Stock deducted for order: ${orderId}`
        });
      }

      return {
        success: true,
        message: `✅ Stock confirmed for ${orderItems.length} items`
      };
    } catch (error) {
      console.error('❌ Error confirming order stock:', error);
      throw error;
    }
  }

  /**
   * Release/unreserve stock when payment fails or user cancels
   */
  async releaseStock(orderId: string, orderItems: any[]) {
    try {
      for (const item of orderItems) {
        const inventory = await Inventory.findOne({
          productId: item.productId,
          variantSku: item.variantSku
        });

        if (!inventory) continue;

        // Move reserved → available
        await Inventory.findByIdAndUpdate(
          inventory._id,
          {
            $inc: {
              reserved: -item.quantity,
              available: +item.quantity
            },
            $set: { lastUpdated: new Date() }
          }
        );

        // Log in StockMovement
        await StockMovement.create({
          inventoryId: inventory._id,
          productId: item.productId,
          variantSku: item.variantSku,
          quantity: item.quantity,
          type: 'UNRESERVED',
          reference: {
            type: 'Order',
            id: new Types.ObjectId(orderId)
          },
          reason: 'Payment failed or order cancelled',
          notes: `Stock released for order: ${orderId}`
        });
      }

      return {
        success: true,
        message: `✅ Stock released for ${orderItems.length} items`
      };
    } catch (error) {
      console.error('❌ Error releasing stock:', error);
      throw error;
    }
  }

  /**
   * Find and release expired reservations (run as cron job)
   */
  async releaseExpiredReservations() {
    try {
      // Find orders with expired reservations
      const Order = require('../models/Order').default;
      
      const expiredOrders = await Order.find({
        orderStatus: 'pending',
        reservationExpiresAt: { $lt: new Date() },
        paymentStatus: 'unpaid'
      });

      let releasedCount = 0;

      for (const order of expiredOrders) {
        try {
          await this.releaseStock(order._id.toString(), order.orderItems);
          await Order.findByIdAndUpdate(order._id, {
            orderStatus: 'failed',
            notes: 'Reservation expired'
          });
          releasedCount++;
          
          console.log(`⏰ Released expired reservation: Order ${order._id}`);
        } catch (error) {
          console.error(`❌ Error releasing expired order ${order._id}:`, error);
        }
      }

      return {
        success: true,
        releasedCount,
        message: `✅ Released ${releasedCount} expired reservations`
      };
    } catch (error) {
      console.error('❌ Error in releaseExpiredReservations:', error);
      throw error;
    }
  }

  /**
   * Adjust stock manually (admin adjustment)
   */
  async adjustStock(
    productId: string,
    variantSku: string,
    quantity: number,
    type: 'ADD' | 'REMOVE',
    reason: string,
    createdBy: string
  ) {
    try {
      let inventory = await Inventory.findOne({
        productId: new Types.ObjectId(productId),
        variantSku
      });

      if (!inventory) {
        throw new Error('Inventory not found');
      }

      const changeAmount = type === 'ADD' ? quantity : -quantity;

      // Update inventory (available field)
      const updated = await Inventory.findByIdAndUpdate(
        inventory._id,
        {
          $inc: { available: changeAmount },
          $set: { lastUpdated: new Date() }
        },
        { new: true }
      );

      // Log in StockMovement
      await StockMovement.create({
        inventoryId: inventory._id,
        productId: new Types.ObjectId(productId),
        variantSku,
        quantity: Math.abs(quantity),
        type: type === 'ADD' ? 'IN' : 'OUT',
        reference: {
          type: 'AdminAdjustment',
          id: null
        },
        reason,
        createdBy: new Types.ObjectId(createdBy),
        notes: `Manual adjustment: ${type} ${quantity} units`
      });

      return {
        success: true,
        inventory: updated,
        message: `✅ Stock adjusted: ${type} ${quantity} units`
      };
    } catch (error) {
      console.error('❌ Error adjusting stock:', error);
      throw error;
    }
  }

  /**
   * Get inventory report
   */
  async getInventoryReport(filters?: { outOfStock?: boolean; lowStock?: boolean }) {
    try {
      let query = Inventory.aggregate([
        {
          $lookup: {
            from: 'products',
            localField: 'productId',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        {
          $project: {
            productId: 1,
            variantSku: 1,
            available: 1,
            reserved: 1,
            sold: 1,
            productName: '$product.name',
            total: {
              $add: ['$available', '$reserved', '$sold', '$damaged']
            }
          }
        }
      ]);

      if (filters?.outOfStock) {
        query = query.match({ available: { $eq: 0 } });
      }

      if (filters?.lowStock) {
        query = query.match({ available: { $lt: 5, $gt: 0 } });
      }

      const report = await query.exec();
      return report;
    } catch (error) {
      console.error('❌ Error getting inventory report:', error);
      throw error;
    }
  }
}

export default new InventoryService();
```

### Step 1.2: Update Order Model

**File:** `server/models/Order.ts` - Add reservation fields (Already exists! ✅)

Just verify these fields exist:
```typescript
reservedAt?: Date;
reservationExpiresAt?: Date;
paymentStatus: 'unpaid' | 'paid' | 'refunded';
```

### Step 1.3: Add Inventory Indexes

**File:** `server/models/Inventory.ts` - Ensure indexes exist:

```typescript
// Add to schema before export
inventorySchema.index({ productId: 1, variantSku: 1 }, { unique: true });
inventorySchema.index({ available: 1 });
inventorySchema.index({ reserved: 1 });
inventorySchema.index({ lastUpdated: 1 });

// In StockMovement.ts
stockMovementSchema.index({ inventoryId: 1, createdAt: -1 });
stockMovementSchema.index({ productId: 1, createdAt: -1 });
stockMovementSchema.index({ type: 1, createdAt: -1 });
```

---

## Phase 2: Update Order Controller

### Step 2.1: Create New Inventory Controller

**File:** `server/controllers/inventoryController.ts`

```typescript
import inventoryService from '../services/inventoryService';
import { Request, Response } from 'express';

const inventoryController = {
  
  // GET /api/inventory/check-stock/:productId/:variantSku?quantity=1
  async checkStock(req: Request, res: Response) {
    try {
      const { productId, variantSku } = req.params;
      const { quantity = 1 } = req.query;

      const stock = await inventoryService.checkStock(
        productId,
        variantSku,
        Number(quantity)
      );

      res.json({
        success: true,
        data: stock
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  },

  // GET /api/inventory/product/:productId
  async getProductInventory(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const Inventory = require('../models/Inventory').default;

      const variants = await Inventory.find(
        { productId },
        { available: 1, reserved: 1, sold: 1, variantSku: 1 }
      );

      res.json({
        success: true,
        data: variants
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  },

  // GET /api/inventory/report?status=low|out
  async getReport(req: Request, res: Response) {
    try {
      // Admin only middleware required here
      const { status } = req.query;

      let filters = {};
      if (status === 'low') {
        filters = { lowStock: true };
      } else if (status === 'out') {
        filters = { outOfStock: true };
      }

      const report = await inventoryService.getInventoryReport(filters);

      res.json({
        success: true,
        data: report
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  },

  // PUT /api/inventory/:inventoryId/adjust
  async adjustStock(req: Request, res: Response) {
    try {
      // Admin only required
      const { productId, variantSku, quantity, type, reason } = req.body;
      const { userId } = req.user;

      const result = await inventoryService.adjustStock(
        productId,
        variantSku,
        quantity,
        type,
        reason,
        userId
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
};

export default inventoryController;
```

### Step 2.2: Modify Order Controller - Create Order with Reservation

**File:** `server/controllers/orderController.ts` - Update `createOrder()`:

```typescript
import inventoryService from '../services/inventoryService';

const createOrder = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userId } = req.user;
    const { items, shippingAddress, paymentMethod } = req.body;

    // Validation
    if (!items || items.length === 0) {
      throw new Error('Order items required');
    }

    // ✅ STEP 1: Check & Reserve Stock for ALL items
    const reservations: any[] = [];
    
    for (const item of items) {
      // Check stock available
      const stockCheck = await inventoryService.checkStock(
        item.productId,
        item.variantSku,
        item.quantity
      );

      if (!stockCheck.canBuy) {
        throw new Error(
          `❌ Out of stock: ${item.variantSku} (Only ${stockCheck.available} available)`
        );
      }

      // Reserve stock
      const reservation = await inventoryService.reserveStock(
        item.productId,
        item.variantSku,
        item.quantity
      );

      reservations.push(reservation);
    }

    // ✅ STEP 2: Create Order with status='pending' (reserved)
    const orderCode = generateOrderCode();
    
    const order = await Order.create([{
      userId: new Types.ObjectId(userId),
      orderCode,
      orderItems: items,
      shippingAddress,
      paymentMethod,
      orderStatus: 'pending', // Stock is reserved
      paymentStatus: 'unpaid',
      reservedAt: new Date(),
      reservationExpiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
      totalAmount: calculateTotal(items),
      createdAt: new Date()
    }], { session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      data: {
        orderId: order[0]._id,
        orderCode: order[0].orderCode,
        reservedAt: new Date(),
        reservedUntil: new Date(Date.now() + 15 * 60 * 1000),
        message: '✅ Order created & stock reserved for 15 minutes'
      }
    });

  } catch (error: any) {
    await session.abortTransaction();
    
    console.error('❌ Error creating order:', error);
    res.status(409).json({
      success: false,
      message: error.message || 'Failed to create order'
    });
  } finally {
    session.endSession();
  }
};
```

### Step 2.3: Add New Order Endpoints

**Add to Order Controller:**

```typescript
// PUT /api/orders/:id/confirm-payment
const confirmOrderPayment = async (req: Request, res: Response) => {
  try {
    const { id: orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Order already paid' });
    }

    // ✅ Confirm stock (reserved → sold)
    await inventoryService.confirmOrderStock(
      orderId,
      order.orderItems
    );

    // Update order
    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: 'paid',
      orderStatus: 'processing'
    });

    res.json({
      success: true,
      message: '✅ Payment confirmed, stock deducted'
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// PUT /api/orders/:id/cancel
const cancelOrder = async (req: Request, res: Response) => {
  try {
    const { id: orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.orderStatus === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel completed order' });
    }

    // ✅ Release reserved stock back to available
    if (order.orderStatus === 'pending' && order.paymentStatus === 'unpaid') {
      await inventoryService.releaseStock(orderId, order.orderItems);
    }

    // Update order
    await Order.findByIdAndUpdate(orderId, {
      orderStatus: 'cancelled',
      cancelledAt: new Date()
    });

    res.json({
      success: true,
      message: '✅ Order cancelled, stock released'
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

### Step 2.4: Add Routes

**File:** `server/routes/orderRoutes.ts`

```typescript
import orderController from '../controllers/orderController';
import inventoryController from '../controllers/inventoryController';
import { authMiddleware } from '../middleware/auth';

router.get('/inventory/check-stock/:productId/:variantSku', 
  inventoryController.checkStock);

router.post('/orders', authMiddleware, orderController.createOrder);

router.put('/orders/:id/confirm-payment', authMiddleware, 
  orderController.confirmOrderPayment);

router.put('/orders/:id/cancel', authMiddleware, 
  orderController.cancelOrder);

router.get('/inventory/product/:productId',
  inventoryController.getProductInventory);

router.get('/inventory/report', authMiddleware, adminMiddleware,
  inventoryController.getReport);

router.put('/inventory/adjust', authMiddleware, adminMiddleware,
  inventoryController.adjustStock);
```

---

## Phase 3: Setup Cron Job

**File:** `server/utils/cronJobs.ts`

```typescript
import cron from 'node-cron';
import inventoryService from '../services/inventoryService';

export function setupCronJobs() {
  
  // Every 5 minutes: Release expired reservations
  cron.schedule('*/5 * * * *', async () => {
    console.log('⏰ Running: Check for expired reservations...');
    try {
      const result = await inventoryService.releaseExpiredReservations();
      console.log(result.message);
    } catch (error) {
      console.error('❌ Cron job error:', error);
    }
  });

  console.log('✅ Cron jobs initialized');
}

// In server.ts - call this on startup
setupCronJobs();
```

---

## Phase 4: Frontend - Add Stock Check Hook

**File:** `client/src/hooks/useInventory.ts`

```typescript
import { useState, useEffect } from 'react';
import api from '../services/api';

export function useInventory(productId?: string, variantSku?: string) {
  const [stock, setStock] = useState({
    available: 0,
    reserved: 0,
    canBuy: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId || !variantSku) return;

    const fetchStock = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get(
          `/inventory/check-stock/${productId}/${variantSku}`
        );
        setStock(data.data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch stock');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStock();
  }, [productId, variantSku]);

  return { stock, isLoading, error };
}
```

---

## Testing Checklist

After implementing each phase:

```javascript
// ✅ Test 1: Check stock endpoint
GET /api/inventory/check-stock/product123/SKU-001?quantity=5
Expected: { available: 10, canBuy: true }

// ✅ Test 2: Reserve stock via order creation
POST /api/orders
Body: { items: [{productId, variantSku, quantity: 3}], ... }
Expected: Order created with status='pending', stock.reserved=3

// ✅ Test 3: Confirm payment
PUT /api/orders/{orderId}/confirm-payment
Expected: stock.reserved → stock.sold

// ✅ Test 4: Cancel order
PUT /api/orders/{orderId}/cancel
Expected: stock released back to available

// ✅ Test 5: Expired reservations
(Wait 16 minutes, run cron or manual)
Expected: Expired orders have status='failed', stock released

// ✅ Test 6: Concurrent orders
Simultaneous requests to buy last item
Expected: Only 1 succeeds, others get 409 Conflict
```

---

## Deployment Steps

1. **Backup Inventory table** (if has existing data)
2. **Run migrations** if needed
3. **Deploy inventoryService.ts**
4. **Deploy updated orderController.ts**
5. **Update routes**
6. **Test in staging** (concurrent orders test)
7. **Deploy cron jobs**
8. **Monitor** first 24 hours for errors

---

## Success Indicators

✅ Orders can't be created if out of stock
✅ Reserved stock shows to other customers as "unavailable"
✅ Expired reservations auto-released after 15 mins
✅ Stock deducted only after payment confirmed
✅ No overselling even with concurrent requests
✅ Stock movement audit trail complete

