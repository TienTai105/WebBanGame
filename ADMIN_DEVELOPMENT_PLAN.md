# 🚀 KỀ HOẠCH PHÁT TRIỂN TRANG ADMIN - VOLTRIX

## 📋 Nội Dung
1. [Kiến Trúc Tổng Thể](#kiến-trúc-tổng-thể)
2. [Các Module Chính](#các-module-chính)
3. [Lộ Trình Triển Khai (Roadmap)](#lộ-trình-triển-khai)
4. [Chi Tiết Backend](#chi-tiết-backend)
5. [Tech Stack](#tech-stack)
6. [Danh Sách Công Việc Chi Tiết](#danh-sách-công-việc-chi-tiết)

---

## 🏗️ Kiến Trúc Tổng Thể

```
Admin Layout
├── Sidebar Navigation (Fixed)
│   ├── Logo
│   ├── Menu Items
│   │   ├── 📊 Dashboard
│   │   ├── 📦 Quản lý sản phẩm
│   │   ├── 📋 Quản lý đơn hàng
│   │   ├── 📰 Quản lý tin tức
│   │   ├── ⚙️ Quản lý hệ thống
│   │   ├── 👥 Quản lý user
│   │   ├── 🎁 Quản lý khuyến mãi
│   │   └── ⭐ Quản lý review
│   └── User Profile (Bottom)
│
├── Header
│   ├── Breadcrumb
│   ├── Search/Filter
│   ├── Notifications
│   └── User Menu + Logout
│
└── Main Content Area
    ├── Dashboard / Module Pages
    └── Modal/Drawer (Add, Edit)
```

---

## 📊 Các Module Chính

### 1. 📊 DASHBOARD - THỐNG KÊ & PHÂN TÍCH

#### KPIs Cards
```
┌─────────────┬──────────────┬─────────────┬──────────┐
│  💰 Doanh   │  📦 Đơn      │  👥 Khách   │  📈 Tăng │
│   Thu       │   Hàng       │   Hàng      │  Trưởng  │
│ 125.5M ₫    │ 284 đơn      │ 1,245 KH    │  15.3%   │
│ +12% YoY    │ +8% vs tuần  │ +45 vs ngày │  vs năm  │
└─────────────┴──────────────┴─────────────┴──────────┘
```

#### Key Metrics to Track
- **Revenue (Doanh Thu)**
  - Hôm nay, 7 ngày, 30 ngày, tháng, năm
  - YoY growth (So sánh năm trước)
  - By payment method (Momo vs COD)

- **Orders (Đơn Hàng)**
  - Pending (Chờ xác nhận)
  - Processing (Đang xử lý)
  - Shipped (Đã gửi)
  - Completed (Hoàn thành)
  - Cancelled (Bị hủy)
  - Failed (Thanh toán thất bại)

- **Customers (Khách Hàng)**
  - Total customers
  - New customers (hôm nay, tuần, tháng)
  - Repeat rate (% khách quay lại)

- **Conversion Metrics**
  - Visitor → Order conversion rate
  - Average Order Value (AOV)
  - Cart abandonment rate

#### Charts & Visuals
```
1. Line Chart - "Doanh Thu Theo Ngày/Tuần/Tháng"
   - X: Ngày/Tuần/Tháng
   - Y: Doanh thu (₫)
   - Toggle: 30 days / 90 days / 6 months / 1 year

2. Pie Chart - "Phương Thức Thanh Toán"
   - Momo: 65%
   - COD: 35%

3. Bar Chart - "Top 10 Sản Phẩm Bán Chạy"
   - X: Sản phẩm
   - Y: Số lượng/Doanh số

4. Data Tables
   - Recent Orders (10 mới nhất)
   - Low Stock Alert (Sản phẩm sắp hết)
```

---

### 2. 📦 QUẢN LÝ SẢN PHẨM

#### Danh Sách Sản Phẩm
- **Columns**: ID, Tên, Danh mục, Giá, Stock, Status, Actions
- **Search**: Tên sản phẩm, SKU
- **Filter**:
  - By Category
  - By Status (Published / Draft)
  - By Stock (In stock / Low stock / Out of stock)
- **Sort**: Name, Price, Created date, Stock
- **Bulk Actions**: 
  - Đánh dấu Featured
  - Thay đổi giá
  - Cập nhật stock
  - Thay đổi status

#### Thêm/Sửa Sản Phẩm
```
Form Fields:
├── Tên sản phẩm (text, required)
├── Slug (auto-generated from name)
├── Danh mục (select, required)
├── Mô tả ngắn (textarea)
├── Nội dung chi tiết (rich text editor)
├── Giá gốc (number)
├── Giá bán (number)
├── Stock ban đầu (number)
├── SKU (text, unique)
├── Hình ảnh chính (image upload)
├── Hình ảnh phụ (multi-upload, drag & drop)
├── Variants
│   ├── Tên variant
│   ├── Giá variant
│   └── Stock variant
├── Tags (multi-select)
├── SEO Friendly
│   ├── Meta title
│   ├── Meta description
│   └── Meta keywords
├── Status (Published / Draft)
└── Save button
```

#### Stock Management
- Xem tồn kho theo variant
- Nhập thêm hàng (Thêm số lượng)
- Kiểm kho (Cập nhật tương ứng)
- Lịch sử thay đổi stock
- Low stock alert (< 10 items)

#### Import/Export
- **Export**: CSV với tất cả sản phẩm
- **Import**: CSV thêm/cập nhật sản phẩm hàng loạt

---

### 3. 📋 QUẢN LÝ ĐƠN HÀNG

#### Danh Sách Đơn Hàng
- **Columns**: Order ID, Khách hàng, Tổng tiền, Trạng thái, Ngày, Actions
- **Search**: Order ID, Customer name/email, Phone
- **Filter**:
  - By Status (Pending, Processing, Shipped, Completed, Cancelled, Failed)
  - By Payment Method (Momo, COD)
  - By Date Range
- **Sort**: Ngày (mới nhất), Giá (cao nhất)

#### Chi Tiết Đơn Hàng
```
┌─────────────────────────────────────────┐
│ Order #ORD-20260325-001                 │
├─────────────────────────────────────────┤
│
│ 👤 Thông tin khách hàng
├─────────────────────────────────────────┤
│ Tên: Trần Tiến Tài
│ Email: tai@email.com
│ Phone: 0987654321
│
│ 📦 Sản phẩm
├─────────────────────────────────────────┤
│ [PS5] 1x 345,000 ₫
│ [Xbox] 2x 250,000 ₫
│ Tổng cộng: 845,000 ₫
│
│ 🏠 Địa chỉ giao hàng
├─────────────────────────────────────────┤
│ Đường: 12 Nguyễn Huệ
│ Quận/Huyện: Quận 1
│ Thành phố: Ho Chi Minh
│
│ 💳 Thanh toán
├─────────────────────────────────────────┤
│ Phương thức: Momo
│ Trạng thái: Paid
│ Ngày: 25/03/2026
│
│ 📊 Trạng thái đơn hàng
├─────────────────────────────────────────┤
│ ✓ Pending (25/03/2026 10:00)
│ ✓ Processing (25/03/2026 11:30)
│ → Shipped (Đang gửi)
│ ○ Completed (Chưa)
│
│ 🔧 Thao tác
├─────────────────────────────────────────┤
│ [Cập nhật trạng thái] [Thêm tracking] 
│ [Ghi chú] [Refund] [In hóa đơn]
└─────────────────────────────────────────┘
```

#### Cập Nhật Trạng Thái
- Pending → Processing → Shipped → Completed
- Hoặc cancel bất kỳ lúc nào
- Tự động lưu lịch sử + timestamp

#### Thao Tác
- **Thêm Tracking Number**: Lưu và gửi email cho KH
- **Ghi Chú Nội Bộ**: Notes cho staff
- **Refund**: Hoàn tiền (cần xác nhận 2 người)
- **Hủy Đơn**: Với lý do
- **In Hóa Đơn**: PDF format
- **Gửi Email**: Nhắc nhở, xác nhận thanh toán

---

### 4. 📰 QUẢN LÝ TIN TỨC / BLOG

#### Danh Sách Bài Viết
- **Columns**: ID, Tiêu đề, Tác giả, Ngày, Status, Actions
- **Search**: Tiêu đề, nội dung
- **Filter**:
  - By Status (Draft / Published)
  - By Author
  - By Date Range
- **Sort**: Created, Updated, Featured

#### Thêm/Sửa Tin Tức
```
Form Fields:
├── Tiêu đề (text, required)
├── Slug (auto-generated, editable)
├── Nội dung (rich text editor - TipTap/Slate)
├── Ảnh thumbnail (image upload)
├── Danh mục (select)
├── Tags (multi-select)
├── Tác giả (auto-fill from current user)
├── Ngày publish (date picker)
├── Schedule (publish vào ngày/giờ cụ thể)
├── SEO Meta
│   ├── Meta title
│   ├── Meta description
│   └── Meta keywords
├── Status (Draft / Published)
└── Save as draft / Publish
```

#### Features
- **Sắp xếp**: Featured, Top, Trending (drag & drop)
- **Schedule**: Tự động publish vào ngày giờ
- **Comments**: Duyệt, trả lời, xóa comment spam
- **Preview**: Xem trước bài viết

---

### 5. ⚙️ QUẢN LÝ HỆ THỐNG

#### Cài Đặt Chung
```
Section 1: Thông tin cửa hàng
├── Shop name
├── Logo
├── Logo màu tối
├── Favicon
├── Contact email
├── Phone
├── Address
└── Business hours

Section 2: Cấu hình
├── Timezone
├── Currency (₫, $, €)
├── Date format
├── Language (VI, EN)
└── Maintenance mode

Section 3: Social Media
├── Facebook URL
├── Instagram URL
├── TikTok URL
└── YouTube URL
```

#### Cài Đặt Email
```
├── SMTP Server
├── SMTP Port
├── SMTP User
├── SMTP Password
├── From email
├── Test Send Button
└── Email Templates
    ├── Order Confirmation
    ├── Order Shipped
    ├── Order Completed
    ├── Password Reset
    └── Welcome Email
```

#### Cài Đặt Thanh Toán
```
├── Momo API
│   ├── Momo API Key
│   ├── Momo Partner Code
│   ├── Momo Secret Key
│   └── Test/Live toggle
│
└── COD
    ├── Bật/Tắt COD
    └── Min/Max order for COD
```

#### System Logs
```
├── Login History
│   ├── User
│   ├── IP
│   ├── Timestamp
│   └── Status
│
├── API Activity
│   ├── Endpoint
│   ├── Method
│   ├── Status code
│   ├── IP
│   └── Timestamp
│
└── Audit Trail
    ├── User
    ├── Action (Create/Update/Delete)
    ├── Entity
    ├── Old value / New value
    └── Timestamp
```

#### Backup & Maintenance
- Database backup (Schedule)
- Cache clear
- System health check
- Disk usage

---

### 6. 👥 QUẢN LÝ USER - PHÂN QUYỀN

#### User Roles & Permissions

| Role | Dashboard | Product | Order | News | System | User | Promo | Review |
|------|:---------:|:-------:|:-----:|:----:|:------:|:----:|:-----:|:------:|
| ADMIN | ✅ R/W | ✅ R/W | ✅ R/W | ✅ R/W | ✅ R/W | ✅ R/W | ✅ R/W | ✅ R/W |
| STAFF | ✅ R | ⚠️ R (* ) | ⚠️ R/W (* ) | ❌ | ❌ | ❌ | ❌ | ✅ Moderate |
| MODERATOR | ❌ | ❌ | ❌ | ✅ R/W | ❌ | ❌ | ❌ | ✅ R/W |

**(*) = Cần OTP xác nhận cho mỗi thao tác quan trọng**

#### Danh Sách User
- **Columns**: ID, Tên, Email, Role, Status, Last login, Actions
- **Search**: Tên, email
- **Filter**: By Role, By Status (Active/Inactive)
- **Sort**: Created, Last login

#### Thêm/Sửa User
```
Form Fields:
├── Full name (required)
├── Email (required, unique)
├── Phone
├── Password (auto-generate)
├── Role (Admin / Staff / Moderator)
├── Status (Active / Inactive)
└── Departments (optional)
```

#### Thao Tác
- **Reset Password**: Gửi reset link via email
- **Chang Role**: Với xác nhận từ Admin khác
- **Deactivate/Activate**: Tạm khóa account
- **View Audit Log**: Lịch sử hành động của user
- **Delete**: Soft delete (không xóa dữ liệu)

#### Staff Action Verification Flow
```
User (STAFF) → Action (Edit Product)
    ↓
System: "Cần xác nhận. OTP gửi tới email"
    ↓
User nhập OTP
    ↓
System: Verify OTP (5 phút expiry)
    ↓
✓ OTP đúng → Action được thực hiện + Audit log
✗ OTP sai → Thử lại (max 3 lần)
```

---

### 7. 🎁 QUẢN LÝ KHUYẾN MÃI

#### Các Loại Khuyến Mãi
1. **Discount Code** (SAVE10 → 10%)
2. **Free Shipping** (FREESHIP)
3. **Fixed Amount** (SUMMER50 → 50k ₫)
4. **Percentage** (FLASH → 20% off)
5. **Buy X Get Y** (Bundle deals)

#### Danh Sách Khuyến Mãi
- **Columns**: Code, Type, Value, Usage, Status, Expiry, Actions
- **Search**: Code
- **Filter**: By Status, By Type, By Date Range
- **Sort**: Created, Expiry, Usage count

#### Thêm/Sửa Khuyến Mãi
```
Form Fields:
├── Code (text, required, uppercase)
├── Tên (optional)
├── Loại (Select: Discount %, Fixed, Free shipping)
├── Giá trị (number)
├── Mô tả
├── Điều kiện áp dụng
│   ├── Min order (₫)
│   ├── Max discount (₫)
│   ├── Applicable categories
│   └── Applicable products
├── Ngày bắt đầu
├── Ngày kết thúc
├── Max usage (overall)
├── Max per customer
├── Status (Active / Inactive)
└── Save
```

#### Thống Kê
- Số lần sử dụng
- Doanh số từ khuyến mãi
- Popular codes (Top 10)
- Revenue impact

---

### 8. ⭐ QUẢN LÝ REVIEW

#### Danh Sách Review
- **Columns**: Product, Star, Author, Content, Status, Date, Actions
- **Search**: Product name, author name, content
- **Filter**:
  - By Rating (1⭐, 2⭐, 3⭐, 4⭐, 5⭐)
  - By Status (Pending, Approved, Rejected)
  - By Product
  - By Date Range
- **Sort**: Created, Rating, Updated

#### Chi Tiết Review
```
┌──────────────────────────────────────────┐
│ ⭐⭐⭐⭐⭐ Rất tốt, sản phẩm chất lượng
├──────────────────────────────────────────┤
│ Tác giả: Nguyễn Văn A
│ Sản phẩm: PlayStation 5
│ Ngày: 25/03/2026
│ Status: Pending
│
│ Nội dung: "Rất hài lòng với sản phẩm..."
│
│ Upload ảnh: [image1.jpg] [image2.jpg]
│
│ 👍 Helpful: 25
│ 👎 Not helpful: 3
│
│ [Approve] [Reject] [Response] [Delete]
└──────────────────────────────────────────┘
```

#### Thao Tác
- **Duyệt Review**: Approve / Reject (với lý do)
- **Trả Lời**: Admin response to review
- **Xóa**: Xóa review spam
- **Highlight**: Pinned review (hiển thị trên top)

#### Thống Kê
- Average rating per product
- Review count per product
- Sentiment analysis (Positive/Negative/Neutral)

---

## 📅 Lộ Trình Triển Khai (Roadmap)

### 🔷 Phase 1: Cơ Sở Hạ Tầng (1-2 tuần)
**Mục tiêu**: Thiết lập layout, authentication, permission system

#### Backend
- [ ] API Routes cơ bản cho admin
- [ ] Admin authentication (JWT + check role)
- [ ] Permission middleware
- [ ] Audit logging system
- [ ] OTP verification service (untuk staff actions)

**Endpoints**:
```
POST   /api/admin/auth/login
POST   /api/admin/auth/logout
GET    /api/admin/auth/verify
POST   /api/admin/auth/refresh-token
POST   /api/admin/verify-otp
```

#### Frontend
- [ ] Admin layout component (Sidebar + Header)
- [ ] Route protection (chỉ admin/staff có access)
- [ ] Permission checking utility
- [ ] Navigation component
- [ ] User context/auth state

**Files to create**:
```
src/pages/Admin/
├── AdminLayout.tsx
├── AdminHome.tsx
├── Login.tsx
└── ...

src/components/admin/
├── AdminSidebar.tsx
├── AdminHeader.tsx
├── AdminBreadcrumb.tsx
└── ...

src/utils/
├── adminAuth.ts
├── permissions.ts
└── ...
```

#### Keys tasks
1. Admin login page
2. Admin layout (sidebar + header)
3. Role-based route protection
4. Menu items routing

---

### 🔶 Phase 2: Core Modules (2-3 tuần)
**Mục tiêu**: Implement dashboard, product, order, news management

#### Week 1: Dashboard
- [ ] KPI cards (Revenue, Orders, Customers, Conversion)
- [ ] Revenue chart (line chart - hôm nay/7 ngày/30 ngày)
- [ ] Payment method pie chart
- [ ] Top products bar chart
- [ ] Recent orders table
- [ ] Low stock alert table

**API Endpoints**:
```
GET /api/admin/dashboard/stats
GET /api/admin/dashboard/revenue-chart
GET /api/admin/dashboard/payment-methods
GET /api/admin/dashboard/top-products
GET /api/admin/dashboard/recent-orders
GET /api/admin/dashboard/low-stock
```

#### Week 2: Product Management
- [ ] Product list page (table, search, filter, sort)
- [ ] Add product form
- [ ] Edit product form
- [ ] Bulk actions (Featured, Price, Stock, Status)
- [ ] Stock management (Import, Check, History)
- [ ] Product preview

**API Endpoints**:
```
GET    /api/admin/products
POST   /api/admin/products
GET    /api/admin/products/:id
PUT    /api/admin/products/:id
DELETE /api/admin/products/:id
PUT    /api/admin/products/:id/stock
POST   /api/admin/products/bulk-actions
GET    /api/admin/products/categories
POST   /api/admin/products/import-csv
GET    /api/admin/products/export-csv
```

#### Week 3: Order Management
- [ ] Order list page (table, search, filter, sort)
- [ ] Order detail page
- [ ] Status update
- [ ] Add tracking number
- [ ] Internal notes
- [ ] Refund/Cancel order
- [ ] Print invoice
- [ ] Email notifications

**API Endpoints**:
```
GET    /api/admin/orders
GET    /api/admin/orders/:id
PUT    /api/admin/orders/:id/status
POST   /api/admin/orders/:id/tracking
POST   /api/admin/orders/:id/notes
POST   /api/admin/orders/:id/refund
POST   /api/admin/orders/:id/cancel
GET    /api/admin/orders/:id/invoice
POST   /api/admin/orders/:id/send-email
```

---

### 🟠 Phase 3: Content & System (1-2 tuần)
**Mục tiêu**: News, System settings, User management

#### Week 1: News Management
- [ ] News list page
- [ ] Add/Edit news form (rich text editor)
- [ ] Thumbnail upload
- [ ] Tags & Categories
- [ ] Schedule publish
- [ ] Comment moderation
- [ ] Preview

**API Endpoints**:
```
GET    /api/admin/news
POST   /api/admin/news
GET    /api/admin/news/:id
PUT    /api/admin/news/:id
DELETE /api/admin/news/:id
GET    /api/admin/news/:id/comments
PUT    /api/admin/news/:id/comments/:commentId
DELETE /api/admin/news/:id/comments/:commentId
```

#### Week 2: System & User Management
- [ ] System settings page
- [ ] Email configuration
- [ ] Payment configuration
- [ ] System logs
- [ ] Backup & Maintenance
- [ ] User list page
- [ ] User roles management
- [ ] Reset password
- [ ] Audit logs

**API Endpoints**:
```
GET    /api/admin/settings
PUT    /api/admin/settings
GET    /api/admin/logs
GET    /api/admin/users
POST   /api/admin/users
PUT    /api/admin/users/:id
DELETE /api/admin/users/:id
PUT    /api/admin/users/:id/role
POST   /api/admin/users/:id/reset-password
GET    /api/admin/audit-logs
```

---

### 🟡 Phase 4: Bonus Features (1 tuần)
**Mục tiêu**: Khuyến mãi, Review management, Polish

#### Promo Management
- [ ] Promo list page
- [ ] Add/Edit promo form
- [ ] Discount code generator
- [ ] Promo statistics
- [ ] Export promo report

**API Endpoints**:
```
GET    /api/admin/promos
POST   /api/admin/promos
PUT    /api/admin/promos/:id
DELETE /api/admin/promos/:id
GET    /api/admin/promos/:id/stats
POST   /api/admin/promos/generate-codes
```

#### Review Management
- [ ] Review list page (search, filter, sort)
- [ ] Review approval/rejection
- [ ] Response to review
- [ ] Pin important reviews
- [ ] Review statistics

**API Endpoints**:
```
GET    /api/admin/reviews
PUT    /api/admin/reviews/:id/status
POST   /api/admin/reviews/:id/response
DELETE /api/admin/reviews/:id
PUT    /api/admin/reviews/:id/pin
GET    /api/admin/reviews/stats
```

---

## 🔧 Chi Tiết Backend

### Database Schema Extensions

#### Admin User Model
```javascript
AdminUser {
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  role: Enum (ADMIN, STAFF, MODERATOR),
  department: String,
  status: Enum (ACTIVE, INACTIVE),
  lastLogin: Date,
  loginHistory: [{
    ip: String,
    userAgent: String,
    timestamp: Date,
    status: String (SUCCESS, FAILED)
  }],
  createdAt: Date,
  updatedAt: Date
}
```

#### Audit Log Model
```javascript
AuditLog {
  _id: ObjectId,
  admin_id: ObjectId (ref: AdminUser),
  action: Enum (CREATE, UPDATE, DELETE, LOGIN, LOGOUT),
  entity: String (Product, Order, News, User, Promo, Review),
  entityId: ObjectId,
  changes: {
    fieldName: {
      oldValue: Mixed,
      newValue: Mixed
    }
  },
  ipAddress: String,
  timestamp: Date
}
```

#### OTP Verification Model
```javascript
OTPVerification {
  _id: ObjectId,
  admin_id: ObjectId (ref: AdminUser),
  otp: String,
  action: String (EDIT_PRODUCT, CHANGE_ROLE, DELETE_USER),
  actionData: Mixed,
  expiresAt: Date,
  attempts: Number (max 3),
  createdAt: Date
}
```

#### Promo Code Model
```javascript
PromoCode {
  _id: ObjectId,
  code: String (unique, uppercase),
  type: Enum (PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING, BUY_X_GET_Y),
  value: Number,
  description: String,
  minOrder: Number,
  maxDiscount: Number,
  startDate: Date,
  endDate: Date,
  maxUsage: Number,
  maxPerCustomer: Number,
  applicableCategories: [ObjectId],
  applicableProducts: [ObjectId],
  usageCount: Number,
  totalRevenue: Number,
  status: Enum (ACTIVE, INACTIVE),
  createdBy: ObjectId (ref: AdminUser),
  createdAt: Date,
  updatedAt: Date
}
```

#### Review Model (Add fields)
```javascript
Review {
  // existing fields...
  status: Enum (PENDING, APPROVED, REJECTED),
  adminResponse: {
    content: String,
    respondedBy: ObjectId (ref: AdminUser),
    respondedAt: Date
  },
  isPinned: Boolean,
  helpful: Number,
  unhelpful: Number,
  approvedAt: Date,
  approvedBy: ObjectId (ref: AdminUser)
}
```

---

## 💻 Tech Stack

### Frontend
```
✅ React 18 + TypeScript
✅ Vite (bundler)
✅ TailwindCSS (styling)
✅ React Router (routing)
✅ React Hook Form + Zod (forms)
✅ TanStack Query / React Query (data fetching)
✅ Recharts (charts)
✅ TanStack Table (data tables)
✅ TipTap (rich text editor)
✅ Date-fns (date utilities)
✅ Zustand (state management)
```

### Backend
```
✅ Express.js
✅ TypeScript
✅ MongoDB + Mongoose
✅ JWT (authentication)
✅ Nodemailer (email)
✅ Winston (logging)
✅ Bull (job queue for async tasks)
✅ Sharp (image processing)
✅ Multer (file upload)
```

### DevOps/Tools
```
✅ GitHub (version control)
✅ Docker (containerization)
✅ PM2 (process management)
✅ ESLint + Prettier (code quality)
✅ Jest + React Testing Library (testing)
```

---

## ✅ Danh Sách Công Việc Chi Tiết

### Phase 1: Infrastructure

#### Backend
- [ ] Setup admin routes file `/routes/admin.routes.ts`
- [ ] Create admin authentication middleware
- [ ] Create role-based access control middleware
- [ ] Setup audit logging service
- [ ] Create OTP verification service
- [ ] AdminUser model + controller
- [ ] Login/Logout endpoints
- [ ] Token refresh endpoint
- [ ] OTP generation + verification endpoints
- [ ] Password reset email template

#### Frontend
- [ ] Create `/pages/Admin/AdminAuth.tsx` (Login)
- [ ] Create `/pages/Admin/AdminLayout.tsx` (Main layout)
- [ ] Create `/components/admin/AdminSidebar.tsx`
- [ ] Create `/components/admin/AdminHeader.tsx`
- [ ] Create `/components/admin/AdminBreadcrumb.tsx`
- [ ] Create admin auth context/hook
- [ ] Create permission checking utility
- [ ] Setup admin route protection
- [ ] Create sidebar navigation component
- [ ] Setup user menu + logout

### Phase 2: Dashboard

#### Backend
- [ ] GET `/api/admin/dashboard/stats` - KPI data
- [ ] GET `/api/admin/dashboard/revenue-chart` - Revenue data by date
- [ ] GET `/api/admin/dashboard/payment-methods` - Payment breakdown
- [ ] GET `/api/admin/dashboard/top-products` - Top 10 products
- [ ] GET `/api/admin/dashboard/recent-orders` - 10 recent orders
- [ ] GET `/api/admin/dashboard/low-stock` - Low stock products

#### Frontend
- [ ] Create `/pages/Admin/Dashboard.tsx`
- [ ] KPI cards component
- [ ] Revenue line chart
- [ ] Payment pie chart
- [ ] Top products bar chart
- [ ] Recent orders table
- [ ] Low stock alert table
- [ ] Date range picker for dashboard
- [ ] Charts + loading states

### Phase 2: Product Management

#### Backend
- [ ] GET `/api/admin/products` - List products
- [ ] POST `/api/admin/products` - Create product
- [ ] GET `/api/admin/products/:id` - Get product detail
- [ ] PUT `/api/admin/products/:id` - Update product
- [ ] DELETE `/api/admin/products/:id` - Delete product
- [ ] PUT `/api/admin/products/:id/stock` - Update stock
- [ ] POST `/api/admin/products/bulk-actions` - Bulk operations
- [ ] GET `/api/admin/products/categories` - Get categories
- [ ] POST `/api/admin/products/import-csv` - Import products
- [ ] GET `/api/admin/products/export-csv` - Export products

#### Frontend
- [ ] Create `/pages/Admin/ProductManager.tsx`
- [ ] Product list table (search, filter, sort)
- [ ] Add product form + modal
- [ ] Edit product form + modal
- [ ] Stock management section
- [ ] Image upload (multi)
- [ ] Variants input
- [ ] Rich text editor for description
- [ ] Product preview page
- [ ] CSV import/export buttons
- [ ] Bulk action checkboxes

### Phase 2: Order Management

#### Backend
- [ ] GET `/api/admin/orders` - List orders
- [ ] GET `/api/admin/orders/:id` - Get order detail
- [ ] PUT `/api/admin/orders/:id/status` - Update status
- [ ] POST `/api/admin/orders/:id/tracking` - Add tracking
- [ ] POST `/api/admin/orders/:id/notes` - Add notes
- [ ] POST `/api/admin/orders/:id/refund` - Process refund
- [ ] POST `/api/admin/orders/:id/cancel` - Cancel order
- [ ] GET `/api/admin/orders/:id/invoice` - Generate invoice
- [ ] POST `/api/admin/orders/:id/send-email` - Send email

#### Frontend
- [ ] Create `/pages/Admin/OrderManager.tsx`
- [ ] Order list table (search, filter, sort)
- [ ] Order detail page
- [ ] Status update dropdown
- [ ] Tracking number input + send email
- [ ] Internal notes textarea
- [ ] Refund modal
- [ ] Cancel order modal
- [ ] Invoice print view
- [ ] Email template preview

### Phase 3: News Management

#### Backend
- [ ] GET `/api/admin/news` - List news
- [ ] POST `/api/admin/news` - Create news
- [ ] GET `/api/admin/news/:id` - Get news detail
- [ ] PUT `/api/admin/news/:id` - Update news
- [ ] DELETE `/api/admin/news/:id` - Delete news
- [ ] GET `/api/admin/news/:id/comments` - Get comments
- [ ] PUT `/api/admin/news/:id/comments/:commentId` - Approve/Reject comment
- [ ] DELETE `/api/admin/news/:id/comments/:commentId` - Delete comment

#### Frontend
- [ ] Create `/pages/Admin/NewsManager.tsx`
- [ ] News list table (search, filter, sort)
- [ ] Add news form + modal
- [ ] Edit news form + modal
- [ ] Rich text editor for content
- [ ] Thumbnail upload
- [ ] Tags/Categories multi-select
- [ ] Schedule publish date/time picker
- [ ] Preview button
- [ ] Comment moderation view

### Phase 3: System & User Management

#### Backend
- [ ] GET `/api/admin/settings` - Get settings
- [ ] PUT `/api/admin/settings` - Update settings
- [ ] GET `/api/admin/logs` - Get system logs
- [ ] GET `/api/admin/users` - List users
- [ ] POST `/api/admin/users` - Create user
- [ ] PUT `/api/admin/users/:id` - Update user
- [ ] DELETE `/api/admin/users/:id` - Delete user
- [ ] PUT `/api/admin/users/:id/role` - Change role
- [ ] POST `/api/admin/users/:id/reset-password` - Send reset email
- [ ] GET `/api/admin/audit-logs` - Get audit logs

#### Frontend
- [ ] Create `/pages/Admin/Settings.tsx`
- [ ] Create `/pages/Admin/UserManager.tsx`
- [ ] Settings form (shop name, logo, contact, etc.)
- [ ] Email configuration form
- [ ] Payment configuration form
- [ ] User list table
- [ ] Add user form + modal
- [ ] Edit user form + modal
- [ ] Role dropdown
- [ ] Reset password button
- [ ] System logs table
- [ ] Audit logs table

### Phase 4: Promo Management

#### Backend
- [ ] GET `/api/admin/promos` - List promos
- [ ] POST `/api/admin/promos` - Create promo
- [ ] PUT `/api/admin/promos/:id` - Update promo
- [ ] DELETE `/api/admin/promos/:id` - Delete promo
- [ ] GET `/api/admin/promos/:id/stats` - Get promo stats
- [ ] POST `/api/admin/promos/generate-codes` - Generate codes

#### Frontend
- [ ] Create `/pages/Admin/PromoManager.tsx`
- [ ] Promo list table (search, filter, sort)
- [ ] Add promo form + modal
- [ ] Edit promo form + modal
- [ ] Code generator input
- [ ] Date range picker
- [ ] Promo statistics cards
- [ ] Usage chart

### Phase 4: Review Management

#### Backend
- [ ] GET `/api/admin/reviews` - List reviews
- [ ] PUT `/api/admin/reviews/:id/status` - Approve/Reject
- [ ] POST `/api/admin/reviews/:id/response` - Add response
- [ ] DELETE `/api/admin/reviews/:id` - Delete review
- [ ] PUT `/api/admin/reviews/:id/pin` - Pin review
- [ ] GET `/api/admin/reviews/stats` - Get statistics

#### Frontend
- [ ] Create `/pages/Admin/ReviewManager.tsx`
- [ ] Review list table (search, filter, sort)
- [ ] Review detail modal
- [ ] Approve/Reject buttons
- [ ] Response textarea
- [ ] Pin toggle
- [ ] Review statistics cards
- [ ] Sentiment chart (if possible)

---

## 🎯 Success Criteria

### Phase 1 ✅
- [ ] Admin login works
- [ ] Layout displays correctly
- [ ] Routes are protected
- [ ] Audit logging works

### Phase 2 ✅
- [ ] Dashboard shows accurate KPIs
- [ ] Charts render correctly
- [ ] Product CRUD operations work
- [ ] Order status updates work
- [ ] Stock management works

### Phase 3 ✅
- [ ] News management works
- [ ] Settings are saved
- [ ] User management works
- [ ] Logs are recorded

### Phase 4 ✅
- [ ] Promo codes work
- [ ] Review moderation works
- [ ] All features integrated

---

## 📞 Liên Hệ & Hỗ Trợ

Nếu có câu hỏi, clarification hoặc cần điều chỉnh kế hoạch:
- Tạo issue trên GitHub
- Discuss design decisions
- Adjust timeline nếu cần

---

**Last Updated**: 25/03/2026  
**Status**: 📋 Planning  
**Next Step**: Phase 1 - Infrastructure
