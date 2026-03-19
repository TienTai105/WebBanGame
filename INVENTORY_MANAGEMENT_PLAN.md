# WebBanGame - Inventory Management System Plan
**Goal:** Prevent overselling while maintaining good UX and data consistency

---

## 📊 Current State Assessment

### Models Already Exist ✅
- **Product** - Has `stock` field per variant
- **Inventory** - Tracks: `available`, `reserved`, `sold`, `damaged`
- **StockMovement** - Audit trail for all stock changes
- **Order** - Has `reservedAt`, `reservationExpiresAt` fields (already prepared!)

### What's Missing ❌
- **Inventory service layer** - No business logic for stock operations
- **Stock validation in checkout** - No checks to prevent oversell
- **API endpoints** - No endpoints to check/reserve stock
- **Reservation system** - Not implemented despite schema support
- **Frontend stock checks** - Product page doesn't validate stock
- **Concurrent request handling** - No atomic operations for simultaneous orders

---

## 🎯 Proposed Architecture

### Stock States Lifecycle

```
Available Stock (Buyer Ready)
    ↓
Entry trigger: Add to cart
    ↓
STEP 1: Stock Check
├─ Query Inventory.available >= quantity?
├─ If NO → Block (show "Out of Stock")
└─ If YES → Continue
    
    ↓
STEP 2: Hold/Reserve (When checkout starts)
├─ Create Reservation (temporary hold)
├─ If success: Show "X reserved for you" in checkout
├─ Expiry: 15 minutes (configurable)
└─ If reserved by others: Show "Only Y left in stock"
    
    ↓
STEP 3: Payment Processing
├─ Order created with status: 'pending' (reserved)
├─ Payment processing...
├─ If success: Mark reserved → sold
└─ If fail: Release reservation back to available
    
    ↓
STEP 4: Order Confirmed/Fulfilled
├─ Inventory.available -= quantity
├─ Inventory.sold += quantity
├─ Create StockMovement record
└─ Send email to customer
```

---

## 💾 Database Schema Updates

### New Collection: StockReservation (OPTIONAL - can use Order)

```javascript
{
  _id: ObjectId,
  productId: ObjectId,
  variantSku: String,
  userId: ObjectId,
  orderId: ObjectId, // null if just holding cart
  quantity: Number,
  reservedAt: Date,
  expiresAt: Date, // 15 mins default
  status: 'active' | 'released' | 'converted_to_order'
}
```

**Alternative:** Use Order `reservedAt` + `reservationExpiresAt` ✅ (Already exists!)

### Inventory Schema Updates

Add this field to track pending/locked stock:
```javascript
pending: {
  type: Number,
  default: 0,
  min: 0
} // Stock in pending orders awaiting payment confirmation
```

**Formula:**
```
Total Stock = available + reserved + pending
Available for Sale = available (what customers see)
```

---

## 🔧 Backend Implementation

### 1. Create Inventory Service Layer

**File:** `server/services/inventoryService.ts`

```typescript
// Stock check (non-blocking)
async checkStock(productId, variantSku, quantity): Promise<boolean>
  
// Reserve stock when checkout starts
async reserveStock(productId, variantSku, quantity): Promise<ReservationId>

// Confirm order (convert reserved → sold)
async confirmOrderStock(orderId): Promise<void>

// Release/unreserve (if payment fails or cart abandoned)
async releaseStock(reservationId): Promise<void>

// Get current stock levels
async getStockLevels(productId, variantSku): Promise<InventoryData>

// Auto-release expired reservations (cron job)
async releaseExpiredReservations(): Promise<number>

// Create stock movement audit log
async logStockMovement(data): Promise<void>
```

### 2. Update Order Controller

**File:** `server/controllers/orderController.ts`

```typescript
// NEW ENDPOINT: Check stock before adding to cart
GET /api/orders/check-stock/:productId/:variantSku?quantity=1
├─ Query Inventory collection
├─ Return: { available, reserved, canBuy: boolean }
└─ Response: 200 { available: 5, reserved: 2, canBuy: true }

// MODIFIED: Create Order - Now reserves stock
POST /api/orders
├─ 1. Validate all order items exist
├─ 2. FOR EACH item: reserveStock()
├─ 3. If ALL reserved: Create order with status='pending'
├─ 4. If ANY fails: Release all, return 409 (Conflict)
├─ 5. Set reservationExpiresAt = now + 15 minutes
└─ Response: 201 { orderId, reservedUntil: "timestamp" }

// NEW: Confirm/Finalize Order (after payment success)
PUT /api/orders/:id/confirm-stock
├─ 1. Find order (status='pending' or 'reserved')
├─ 2. FOR EACH item: confirmOrderStock() (reserved → sold)
├─ 3. LogStockMovement(type='OUT', reference=orderId)
├─ 4. Update order.paymentStatus='paid'
└─ Response: 200 { message: "Order confirmed and stock adjusted" }

// NEW: Release Reserved Stock (payment failed)
PUT /api/orders/:id/release-stock
├─ 1. Find order
├─ 2. Release all reserved items
├─ 3. Update order.orderStatus='cancelled'
└─ Response: 200 { message: "Stock released, order cancelled" }
```

### 3. Create Inventory Controller

**File:** `server/controllers/inventoryController.ts`

```typescript
// Get all variants of a product with stock
GET /api/inventory/product/:productId
├─ Response: [
│   { variantSku: 'PS5-BLK', available: 5, reserved: 2 },
│   { variantSku: 'PS5-WHT', available: 0, reserved: 1 }
│ ]

// Admin: Update stock (manual adjustment)
PUT /api/inventory/:inventoryId
├─ Body: { type: 'ADD'|'REMOVE', quantity, reason }
├─ Update: available += quantity
├─ Log: StockMovement

// Admin: Get inventory report
GET /api/inventory/report?status=low|out_of_stock
├─ Show products with inventory issues
```

### 4. Add Cron Job - Release Expired Reservations

**File:** `server/utils/cronJobs.ts`

```typescript
// Every 5 minutes: Find expired reservations
cron.schedule('*/5 * * * *', async () => {
  const expired = await Order.find({
    orderStatus: 'pending',
    reservationExpiresAt: { $lt: new Date() },
    paymentStatus: 'unpaid'
  })
  
  for (const order of expired) {
    await releaseStock(order._id)
    await order.updateOne({ orderStatus: 'failed' })
  }
})
```

### 5. Add Atomic/Transactional Operations

**Use MongoDB Sessions for data consistency:**

```typescript
const session = await mongoose.startSession()
session.startTransaction()

try {
  // 1. Check & lock inventory
  const inventory = await Inventory.findOneAndUpdate(
    { productId, variantSku },
    { $inc: { available: -quantity } },
    { session, new: true }
  )
  
  if (inventory.available < 0) {
    throw new Error('Insufficient stock')
  }
  
  // 2. Create order
  const order = await Order.create([{...}], { session })
  
  // 3. Log movement
  await StockMovement.create([{...}], { session })
  
  await session.commitTransaction()
} catch (error) {
  await session.abortTransaction()
  throw error
}
```

---

## 🎨 Frontend Implementation

### 1. Product Detail Page Updates

**File:** `client/src/pages/ProductDetailPage.tsx`

```typescript
// Add stock availability display
├─ Show: "In Stock (5 available)"
├─ Show: "Only 2 left" (if < 5)
├─ Show: "Out of Stock" (greyed out)
└─ Show: "Reserve for 15 mins when ordered"

// Prevent adding to cart if out of stock
const handleAddToCart = async () => {
  const { available } = await checkStockAPI(productId, variantSku, quantity)
  
  if (available >= quantity) {
    addToCart(item)
    toast.success('Added to cart - 15 min reserve')
  } else {
    toast.warning(`Only ${available} available`)
  }
}
```

### 2. Checkout Page Updates

**File:** `client/src/pages/CheckoutPage.tsx`

```typescript
// When user enters checkout:
useEffect(() => {
  // 1. Re-verify all items in stock
  items.forEach(async (item) => {
    const stock = await checkStockAPI(...)
    if (stock < item.quantity) {
      // Show warning
      updateQuantity(item.id, stock)
    }
  })
  
  // 2. Show reservation timer
  ├─ "Your items are reserved until: 2:45 PM"
  ├─ Auto-update countdown
  └─ If expired: show "Reservation expired, replace items?"
}, [])

// Add "Confirm & Reserve" button in checkout
const handleReserveStock = async () => {
  const { reservedUntil } = await reserveStockAPI(items)
  toast.success(`Stock reserved until ${reservedUntil}`)
  setReservationTime(reservedUntil)
}
```

### 3. Cart Actions

**File:** `client/src/hooks/useCart.ts`

```typescript
// When adding item to cart
const addToCart = async (item) => {
  // Check current stock
  if (!(await checkStock(item))) {
    toast.error('Item out of stock')
    return
  }
  
  // Add to cart (soft reserve - no DB call)
  cartContext.add(item)
}

// When user views cart after 10 minutes
const validateCart = async () => {
  // Re-check all items still available
  for (const item of cart.items) {
    const available = await checkStockAPI(item.productId)
    if (available < item.quantity) {
      // Reduce quantity or remove
      cart.updateQuantity(item.id, available)
    }
  }
}
```

### 4. Add Stock Info Hook

**File:** `client/src/hooks/useInventory.ts`

```typescript
// Get real-time stock status
const { stock: { available, reserved }, isLoading } = useInventory(productId, variantSku)

// Check if can buy
const canBuy = (quantity) => available >= quantity
```

---

## 📋 Implementation Checklist

### Phase 1: Backend Foundation (Week 1)
- [ ] Create `inventoryService.ts` with stock operations
- [ ] Add MongoDB transactions for atomic operations
- [ ] Create `/check-stock` API endpoint
- [ ] Update Product model to track stock per variant
- [ ] Update Inventory schema (add `pending` field)
- [ ] Set up StockMovement logging

### Phase 2: Order Integration (Week 2)
- [ ] Modify `createOrder` to reserve stock
- [ ] Add `/orders/:id/confirm-stock` endpoint
- [ ] Add `/orders/:id/release-stock` endpoint
- [ ] Implement order expiration logic
- [ ] Add cron job for expired reservations
- [ ] Write unit tests for stock operations

### Phase 3: Frontend Integration (Week 2-3)
- [ ] Add stock display on ProductDetailPage
- [ ] Add `useInventory` hook
- [ ] Integrate stock checks in CartContext
- [ ] Update CheckoutPage with reservation timer
- [ ] Add stock validation before payment
- [ ] Show real-time availability updates

### Phase 4: Admin Dashboard (Week 3)
- [ ] Create Inventory Management page
- [ ] Add stock adjustment UI
- [ ] Create Inventory Report view
- [ ] Add low-stock alerts

### Phase 5: Testing & Optimization (Week 4)
- [ ] Stress test concurrent orders
- [ ] Test race conditions
- [ ] Performance optimize queries
- [ ] Security audit (no API bypassing)
- [ ] E2E testing with Cypress

---

## 🔐 Security Considerations

1. **No Client-Side Trust**: Always validate stock server-side
2. **Race Conditions**: Use database locks/transactions
3. **Fraud Prevention**: 
   - Verify price hasn't changed
   - Log all stock movements
   - Track IP/user for suspicious patterns

4. **Prevent API Bypass**:
   ```typescript
   // ❌ DON'T: Create order without stock check
   // ✅ DO: Every order creation mustflow through reserveStock()
   ```

---

## 📈 Performance Optimization

### Caching Strategy
```javascript
// Cache inventory for 30 seconds (Redis)
const key = `inventory:${productId}:${variantSku}`
const cached = await redis.get(key)
if (cached) return cached

const inventory = await Inventory.findOne({ productId, variantSku })
await redis.setex(key, 30, JSON.stringify(inventory))
```

### Database Indexes (Already Good!)
```
- { productId: 1, variantSku: 1 } - Unique compound
- { available: 1 } - For stock queries
- { reserved: 1 } - For analysis
```

---

## 🚨 Error Handling

| Error | Status | Message | Action |
|-------|--------|---------|--------|
| Out of Stock | 409 | "Only 2 available" | Show available qty |
| Reservation Expired | 410 | "Reservation expired" | Refresh stock |
| Oversold (race) | 408 | "Conflict with another order" | Reduce qty auto-suggest |
| Invalid quantity | 400 | "Qty exceeds stock" | Validate input |

---

## 📊 Inventory Dashboard Metrics

Show admin:
- ✅ Total stock value
- 📦 Available vs Reserved vs Sold
- ⚠️ Low stock items (< 5 units)
- 🔴 Out of stock items
- 📈 Fastest selling items
- 📉 Slow moving inventory
- 💰 AVG days to sell
- 🔄 Stock turnover rate

---

## 🔄 Workflow Examples

### Scenario 1: Successful Order
```
1. User adds item to cart (no DB call)
2. Enters checkout → Click "Reserve & Checkout"
3. API: reserveStock(item) → success
4. Shows: "Reserved until 2:45 PM"
5. User pays → Payment Success
6. API: confirmOrderStock(orderId)
7. Inventory: available--; sold++
8. Order status: pending → paid → processing
```

### Scenario 2: Stock Runs Out
```
1. User adds item (5 available)
2. Another user adds same item (4 left)
3. Another user completes order (2 left)
4. First user tries to reserve → fails
5. API returns: "Only 2 left, reduce qty?"
6. User reduce qty to 2 → success
```

### Scenario 3: Reservation Expires
```
1. User reserves 3 items at 2:30 PM
2. User is AFK...
3. 2:45 PM → Cron job runs
4. Finds expired reserved orders
5. Releases reservation back to available
6. User returns → "Reservation expired"
7. Items automatically re-added to available pool
```

---

## 📞 API Reference Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/inventory/product/:id` | Get all variants stock |
| GET | `/api/orders/check-stock/:id` | Check if qty available |
| POST | `/api/orders` | Create & reserve stock |
| PUT | `/api/orders/:id/confirm-stock` | Confirm payment, finalize stock |
| PUT | `/api/orders/:id/release-stock` | Release reserved stock |
| GET | `/api/reports/inventory` | Inventory report (admin) |
| PUT | `/api/inventory/:id` | Manual adjustment (admin) |

---

## 🎯 Success Metrics

After implementation:
- ✅ Zero oversells
- ✅ < 0.1% inventory discrepancies
- ✅ 99.9% order success rate
- ✅ < 2 second stock lookup
- ✅ < 1% reservation expiration rate
- ✅ Admin visibility into all stock movements

---

## Notes
- **Variant Support**: Full support for SKU-based variants
- **Multi-tenancy Ready**: Can expand to multiple warehouses later
- **Audit Trail**: Every stock change logged in StockMovement
- **Future**: Add warehouse management, stock transfers between warehouses
