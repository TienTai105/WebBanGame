# 🤖 Công Nghệ Xử Lý Đơn Hàng Tự Động

## 📋 Danh Sách Công Nghệ Liên Quan

### **1️⃣ SCHEDULING & AUTOMATION**

#### **node-cron** (^4.2.1)
```typescript
// File: server/utils/cronJobs.ts

// CÁC TÁC VỤ TỰ ĐỘNG:
- Release expired checkout holds (15 minutes)
- Cleanup failed orders (24 hours)
- Auto-confirm COD orders marked as completed
- Auto-update inventory snapshots
- Clean up expired OTP tokens
```

**Công Dụng Chi Tiết:**
- ✅ Chạy mà không cần user trigger
- ✅ Giải phóng stock khi checkout hold hết hạn
- ✅ Tự động release reserved stock
- ✅ Xóa đơn hàng chưa thanh toán sau 24h
- ✅ Auto-sync inventory levels

**Ví Dụ:**
```typescript
// Chạy mỗi 15 phút
cron.schedule('*/15 * * * *', async () => {
  // Release holds hết hạn
  const expiredHolds = await CheckoutHold.find({
    reservedUntil: { $lt: new Date() },
    released: false
  })
  
  for (const hold of expiredHolds) {
    await inventoryService.releaseStock(hold.items)
    hold.released = true
    await hold.save()
  }
})
```

---

### **2️⃣ REAL-TIME UPDATES & NOTIFICATIONS**

#### **Socket.io** (^4.8.3)
```typescript
// File: server/socket.ts

// REAL-TIME EVENTS:
- Order status change → broadcast to admin + customer
- Inventory update → broadcast stock levels
- Payment confirmation → real-time update
- Stock availability alert → notify low inventory
```

**Công Dụng Chi Tiết:**
- ✅ Khi admin update order status → customer nhận notification ngay
- ✅ Broadcast order events: pending → processing → shipped → completed
- ✅ Live inventory updates trong admin dashboard
- ✅ Real-time payment status (Momo callback)
- ✅ Automatic reconnection if disconnected

**Ví Dụ:**
```typescript
// Backend
io.emit('order:status-changed', {
  orderId: order._id,
  newStatus: 'shipped',
  trackingNumber: 'VTP123456'
})

// Frontend (Socket.io client)
socket.on('order:status-changed', (data) => {
  // Auto-update in React component
  queryClient.invalidateQueries('orders')
  toast.success('Đơn hàng được cập nhật')
})
```

---

### **3️⃣ EMAIL NOTIFICATIONS**

#### **Nodemailer** (^6.10.1)
```typescript
// File: server/services/emailService.ts

// AUTO-SEND EMAILS:
- Order confirmation (COD: khi tạo | Momo: khi thanh toán)
- Order status update (pending → processing → shipped → completed)
- Payment confirmation
- Tracking number notification
- Cancellation confirmation
- Refund notification
```

**Công Dụng Chi Tiết:**
- ✅ Send confirmation email tự động khi order tạo
- ✅ Send status update email khi admin change status
- ✅ Send tracking info khi marked as shipped
- ✅ Send refund confirmation khi order cancelled
- ✅ OTP verification email
- ✅ Newsletter emails

**Ví Dụ:**
```typescript
// auto-trigger in order controller
export const createOrder = async (req, res) => {
  const order = await Order.create(...)
  
  // Auto-send email
  if (isCOD) {
    await sendOrderConfirmationEmail({
      to: order.user.email,
      orderCode: order.orderCode,
      // ... order details
    })
  }
}

// Auto-send khi update status
export const updateOrder = async (req, res) => {
  const order = await Order.findByIdAndUpdate(...)
  
  // Auto-send email nếu status thay đổi
  if (order.orderStatus !== existingOrder.orderStatus) {
    await sendOrderStatusUpdateEmail({
      to: order.user.email,
      oldStatus: existingOrder.orderStatus,
      newStatus: order.orderStatus,
      // ... order details
    })
  }
}
```

---

### **4️⃣ DATABASE & TRANSACTIONS**

#### **MongoDB & Mongoose** (^7.5.0)
```typescript
// File: server/models/Order.ts

// AUTO-TRACKING:
- statusHistory array → auto-log status changes
- createdAt, updatedAt → auto-timestamps
- stockConfirmedAt → auto-track confirm time
- Pre/Post hooks → auto-trigger actions
```

**Công Dụng Chi Tiết:**
- ✅ Auto-track order history (who changed status, when)
- ✅ Timestamps (createdAt, updatedAt) automatic
- ✅ Pre-save hooks → validate before save
- ✅ Post-save hooks → trigger side-effects
- ✅ Indexes → auto-optimize queries
- ✅ Transactions → atomic operations (order + inventory)

**Ví Dụ:**
```typescript
// Pre-hook: auto-validate before save
orderSchema.pre('save', async function(next) {
  if (this.orderStatus === 'completed' && !this.stockConfirmedAt) {
    // Auto-set confirm time
    this.stockConfirmedAt = new Date()
  }
  next()
})

// Post-hook: auto-log changes
orderSchema.post('findByIdAndUpdate', async function(doc) {
  if (doc.orderStatus !== this.getOptions().old?.orderStatus) {
    // Auto-create audit log
    await AuditLog.create({
      action: 'STATUS_CHANGE',
      entity: 'Order',
      entityId: doc._id,
      changes: { status: { old, new: doc.orderStatus } }
    })
  }
})
```

---

### **5️⃣ INVENTORY MANAGEMENT SERVICE**

#### **Inventory Service** (server/services/inventoryService.ts)
```typescript
// AUTO-OPERATIONS:
- reserveStock() → auto deduct from available → add to reserved
- confirmOrderStock() → auto deduct from reserved → add to sold
- releaseStockOnCancel() → auto return to available/reserved
```

**Công Dụng Chi Tiết:**
- ✅ Auto-reserve stock khi order tạo
- ✅ Auto-confirm stock khi order completed (COD)
- ✅ Auto-confirm stock khi payment confirmed (Momo)
- ✅ Auto-release stock khi order cancelled
- ✅ Auto-log stock movements (audit trail)
- ✅ Auto-check stock availability
- ✅ Prevent double-confirm with stockConfirmedAt

**Ví Dụ - 3-State Inventory System:**
```
┌─────────────────────────────────────┐
│  AVAILABLE (sẵn bán)                │ ← Người mua thêm vào giỏ
│↓                                    │
│  RESERVED (chờ thanh toán)          │ ← Hold 15-min hoặc checkout
│↓                                    │
│  SOLD (đã shipped)                  │ ← Order completed
└─────────────────────────────────────┘

Tự động điều chỉnh khi:
1. Create checkout hold → AVAILABLE → RESERVED
2. Payment confirmed → RESERVED → SOLD
3. Order cancelled → RESERVED/SOLD → AVAILABLE
```

---

### **6️⃣ AUDIT LOGGING**

#### **AuditLog Model** (server/models/AuditLog.ts)
```typescript
// AUTO-LOGGED:
- Order status changes (who, when, from what to what)
- Inventory movements (reserve, confirm, release)
- User actions (create, delete, update)
- Payment transactions
- Stock corrections
```

**Công Dụng Chi Tiết:**
- ✅ Auto-create audit log mỗi lần thay đổi
- ✅ Track userId → who made change
- ✅ Track timestamp → when
- ✅ Track before/after → what changed
- ✅ Track ipAddress → from where
- ✅ Full order history trace
- ✅ Compliance & security requirements

**Ví Dụ:**
```typescript
// Auto-log when cancelling order
await AuditLog.create({
  action: 'CANCEL_ORDER',
  entity: 'Order',
  entityId: order._id,
  changes: {
    orderStatus: { old: 'pending', new: 'cancelled' },
    stockReleased: true
  },
  userId: req.user._id,
  ipAddress: req.ip,
  timestamp: new Date()
})
```

---

### **7️⃣ AUTHENTICATION & AUTHORIZATION**

#### **JWT & Middleware** (server/middleware/auth.ts)
```typescript
// AUTO-VERIFICATION:
- Every request → auto-verify JWT token
- Auto-extract userId from token
- Auto-check permissions (customer vs admin)
- Auto-reject unauthorized requests
```

**Công Dụng Chi Tiết:**
- ✅ Auto-verify token in every request
- ✅ Auto-reject expired tokens
- ✅ Auto-check role (admin/customer/staff)
- ✅ Auto-restrict endpoints by role
- ✅ Auto-set user context in request
- ✅ Auto-handle token refresh

**Ví Dụ:**
```typescript
export const protect = async (req, res, next) => {
  // Auto-extract token from cookie or header
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1]
  
  if (!token) return res.status(401).json({ error: 'Not authorized' })
  
  // Auto-verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET)
  
  // Auto-set user in request
  req.user = await User.findById(decoded.id)
  
  // Auto-check permissions
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' })
  }
  
  next()
}
```

---

### **8️⃣ PAYMENT INTEGRATION**

#### **Momo/VNPay APIs** (via axios)
```typescript
// AUTO-WEBHOOKS:
- Payment callback → auto-update order status to 'paid'
- Payment timeout → auto-trigger order cancellation
- Payment error → auto-log and notify customer
```

**Công Dụng Chi Tiết:**
- ✅ Auto-receive payment callback from Momo
- ✅ Auto-verify signature
- ✅ Auto-update order paymentStatus → 'paid'
- ✅ Auto-confirm stock (RESERVED → SOLD)
- ✅ Auto-send confirmation email
- ✅ Auto-log payment transaction
- ✅ Auto-notify via Socket.io

**Ví Dụ:**
```typescript
// Payment callback endpoint
export const momoCallback = async (req, res) => {
  // Auto-verify signature
  const isValid = verifyMomoSignature(req.body)
  if (!isValid) return res.status(400).json({ error: 'Invalid' })
  
  // Auto-update order
  const order = await Order.findOne({
    momoRequestId: req.body.requestId
  })
  
  if (req.body.resultCode === 0) {
    // Payment success
    order.paymentStatus = 'paid'
    order.momoTransactionId = req.body.transId
    
    // Auto-confirm stock
    await inventoryService.confirmOrderStock(order.orderItems)
    
    // Auto-send email
    await sendOrderConfirmationEmail(...)
    
    // Auto-broadcast via Socket.io
    io.emit('payment:confirmed', { orderId: order._id })
  }
  
  await order.save()
  res.json({ status: 'success' })
}
```

---

### **9️⃣ FORM VALIDATION & ERROR HANDLING**

#### **Express-validator** (^7.0.0)
```typescript
// AUTO-VALIDATION:
- Validate email format
- Validate required fields
- Validate phone number format
- Validate price (must be positive)
- Validate quantity (must be > 0)
- Auto-reject invalid requests
```

**Công Dụng Chi Tiết:**
- ✅ Auto-sanitize input (trim, escape)
- ✅ Auto-validate data types
- ✅ Auto-check required fields
- ✅ Auto-reject malformed requests
- ✅ Auto-prevent invalid data in database
- ✅ Return error messages to client

**Ví Dụ:**
```typescript
// Auto-validate order creation
const validateCreateOrder = [
  body('orderItems').isArray().notEmpty(),
  body('orderItems.*.quantity').isInt({ min: 1 }),
  body('totalPrice').isFloat({ min: 0 }),
  body('shippingAddress.email').isEmail(),
  body('shippingAddress.phone').isMobilePhone('vi-VN'),
]

// Auto-apply in route
router.post('/orders', validateCreateOrder, createOrder)
```

---

### **🔟 INVENTORY HOLD SYSTEM**

#### **CheckoutHold Model** (server/models/CheckoutHold.ts)
```typescript
// AUTO-EXPIRY:
- Hold created with 15-min expiry
- Cron job checks every 15 min
- Auto-release if expired
- Auto-re-list stock as available
```

**Công Dụng Chi Tiết:**
- ✅ Auto-create hold when user starts checkout (Momo only)
- ✅ Auto-reserve stock for 15 minutes
- ✅ Auto-release after 15 min if not confirmed
- ✅ Auto-prevent overselling
- ✅ Prevent concurrent checkout conflicts
- ✅ Re-enable stock for other shoppers

**Ví Dụ:**
```typescript
// Auto-created hold
const hold = await CheckoutHold.create({
  userId,
  items: orderItems,
  reservedUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 min from now
  released: false
})

// Cron auto-releases expired holds
cron.schedule('*/15 * * * *', async () => {
  const expired = await CheckoutHold.find({
    reservedUntil: { $lt: new Date() },
    released: false
  })
  
  for (const hold of expired) {
    // Auto-release stock
    await inventoryService.releaseStock(hold.items)
    hold.released = true
    await hold.save()
  }
})
```

---

## 📊 AUTO-PROCESSING FLOW DIAGRAM

```
┌──────────────────────────────────────────────────────────────────┐
│                    USER ACTION / EVENT                           │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │ Create Order   │
                    └───────┬────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
    ┌────▼──────┐   ┌──────▼────────┐   ┌────▼──────┐
    │ COD Order │   │ Momo Payment  │   │ VNPay     │
    └────┬──────┘   └──────┬────────┘   └────┬──────┘
         │                 │                  │
    ┌────▼──────────────┬──▼────────────────┬┴──────┐
    │  AUTO-ACTIONS    │   AUTO-ACTIONS   │       │
    ├──────────────────┼──────────────────┤       │
    │ 1. Reserve stock │ 1. Create hold   │       │
    │ 2. Create order  │ 2. Reserve stock │       │
    │ 3. Send email ✉️ │ 3. Create order  │       │
    │ 4. Generate slip │ 4. Send email ✉️ │       │
    │ 5. Socket emit   │ 5. Await payment │       │
    │                  │    callback      │       │
    └────┬─────────────┴──┬───────────────┘       │
         │                │                       │
         │                └──────────┬────────────┘
         │                           │
         │                    ┌──────▼────────┐
         │                    │ Confirm Stock │
         │                    └──────┬────────┘
         │                           │
    ┌────▼───────────────────────────▼──────┐
    │  ADMIN UPDATE ORDER STATUS (shipped)   │
    └────┬─────────────────────────────────┘
         │
    ┌────▼────────────────────────────────────┐
    │  AUTO-ACTIONS (via updateOrder)         │
    ├─────────────────────────────────────────┤
    │ 1. Audit log 📋                         │
    │ 2. Send email ✉️ (status changed)      │
    │ 3. Socket.io emit (real-time update)   │
    │ 4. Update statusHistory array          │
    │ 5. Notify admin dashboard 📊           │
    └────┬─────────────────────────────────┘
         │
    ┌────▼────────────────────────────────────┐
    │ CRON JOBS (Running 24/7)                │
    ├─────────────────────────────────────────┤
    │ ⏰ Every 15 min:                        │
    │   - Release expired holds              │
    │   - Auto-re-list stock                 │
    │                                         │
    │ ⏰ Every 24 hours:                      │
    │   - Clean up unpaid orders             │
    │   - Archive old transactions           │
    │   - Generate reports                   │
    └─────────────────────────────────────────┘
```

---

## 🎯 AUTO-PROCESSING CHECKLIST

### **Order Creation**
- ✅ Express-validator validates input
- ✅ Inventory service reserves stock
- ✅ Mongoose auto-adds timestamps
- ✅ Nodemailer sends confirmation email
- ✅ Socket.io broadcasts to admin
- ✅ Audit log created

### **Payment Confirmation (Momo)**
- ✅ Webhook receives callback
- ✅ Signature auto-verified
- ✅ Inventory auto-confirms stock (RESERVED → SOLD)
- ✅ Nodemailer sends payment confirmation
- ✅ Socket.io broadcasts real-time update
- ✅ AuditLog auto-records transaction

### **Admin Updates Order Status**
- ✅ Model validates status
- ✅ Mongoose pre-hook auto-runs
- ✅ Audit log auto-creates
- ✅ Nodemailer auto-sends email to customer
- ✅ Socket.io auto-broadcasts (frontend auto-updates)
- ✅ Status history array auto-appends

### **Order Cancellation**
- ✅ Check if cancellable
- ✅ Inventory auto-releases stock
- ✅ Payment auto-refunds (if paid)
- ✅ Nodemailer auto-sends cancellation email
- ✅ Socket.io auto-notifies
- ✅ Audit log auto-logs action

### **Scheduled Tasks (24/7)**
- ✅ node-cron auto-releases expired holds
- ✅ Auto-delete unpaid orders after 24h
- ✅ Auto-cleanup old sessions
- ✅ Auto-generate daily reports
- ✅ Auto-optimize indexes
- ✅ Auto-backup database logs

---

## 🔧 CONFIGURATION FILES

| File | Purpose |
|------|---------|
| `server/utils/cronJobs.ts` | Cron schedule definitions |
| `server/socket.ts` | Real-time event handlers |
| `server/services/emailService.ts` | Email templates + send logic |
| `server/services/inventoryService.ts` | Stock operations |
| `server/models/AuditLog.ts` | Change tracking |
| `server/middleware/auth.ts` | Auto-verify requests |
| `server/controllers/orderController.ts` | Order logic + auto-actions |

---

## 📈 BENEFITS OF AUTO-PROCESSING

| Lợi Ích | Chi Tiết |
|--------|---------|
| **Efficiency** | Không cần manual intervention, tiết kiệm nhân lực |
| **Accuracy** | Không lỗi con người, tự động sync data |
| **Speed** | Real-time updates, Socket.io instant notification |
| **Scalability** | Xử lý 10,000+ orders mà không quá tải |
| **Audit Trail** | Toàn bộ history tracked, compliance ready |
| **Customer Experience** | Instant emails, real-time order tracking |
| **Data Integrity** | Transactions ensure atomicity |
| **24/7 Operation** | Cron jobs chạy liên tục, không downtime |

---

## 🚀 FUTURE ENHANCEMENTS

- [ ] AI-based order recommendation
- [ ] Auto-reorder low-stock items
- [ ] ML fraud detection
- [ ] Auto-generate packing labels
- [ ] SMS notifications (Twilio)
- [ ] WhatsApp notifications
- [ ] Predictive inventory management
- [ ] Auto-apply promo codes (rules engine)

---

**Tóm lại**: Hầu hết các tác vụ đơn hàng đều được **tự động hoá** qua các công nghệ: **node-cron** (scheduling), **Socket.io** (real-time), **Nodemailer** (emails), **Mongoose hooks** (database triggers), **Express middleware** (validation), và **Inventory Service** (stock management).
