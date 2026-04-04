# WebBanGame - Use Case Diagram

## 📋 Mô Tả Tổng Quát

WebBanGame là nền tảng e-commerce bán game với **2 actor chính**:
- **Khách Hàng (Đã Login)**: Người mua hàng - **PHẢI đăng nhập để mua**
- **Admin**: Quản trị viên hệ thống

> **Note**: Web **KHÔNG hỗ trợ khách vãng lai (guest checkout)** - CheckoutPage redirect đến login nếu chưa authenticate

---

## 🔄 Use Case Diagram (Mermaid Syntax)

```mermaid
usecase diagram
    left to right direction
    
    actor Customer as "👤 Khách Hàng (Đã Login)"
    actor Admin as "👨‍💼 Admin"
    
    rectangle "WebBanGame E-Commerce" {
        (Đăng Ký / Đăng Nhập)
        (Duyệt Sản Phẩm)
        (Tìm Kiếm)
        (Lọc Danh Mục)
        (Lọc Thương Hiệu)
        (Lọc Platform)
        (Xem Chi Tiết)
        (Viết Đánh Giá)
        (Viết Bình Luận)
        (Thêm Giỏ Hàng)
        (Xem Giỏ Hàng)
        (Thanh Toán COD)
        (Thanh Toán Momo)
        (Hold SP 15')
        (Xem Đơn Hàng)
        (Theo Dõi Giao Hàng)
        
        (Quản Lý SP)
        (Quản Lý Danh Mục)
        (Quản Lý Kho)
        (Quản Lý Đơn Hàng)
        (Cập Nhật Trạng Thái)
        (Quản Lý Khuyến Mãi)
        (Xem Thống Kê)
    }
    
    Customer --> (Đăng Ký / Đăng Nhập)
    Customer --> (Duyệt Sản Phẩm)
    (Duyệt Sản Phẩm) --> (Tìm Kiếm) : include
    (Tìm Kiếm) --> (Lọc Danh Mục) : include
    (Tìm Kiếm) --> (Lọc Thương Hiệu) : include
    (Tìm Kiếm) --> (Lọc Platform) : include
    Customer --> (Xem Chi Tiết)
    (Xem Chi Tiết) --> (Viết Đánh Giá)
    (Xem Chi Tiết) --> (Viết Bình Luận)
    Customer --> (Thêm Giỏ Hàng)
    Customer --> (Xem Giỏ Hàng)
    (Xem Giỏ Hàng) --> (Thanh Toán COD)
    (Xem Giỏ Hàng) --> (Thanh Toán Momo)
    (Thanh Toán Momo) --> (Hold SP 15') : include
    (Thanh Toán COD) --> (Xem Đơn Hàng) : extend
    (Thanh Toán Momo) --> (Xem Đơn Hàng) : extend
    Customer --> (Theo Dõi Giao Hàng)
    
    Admin --> (Quản Lý SP)
    Admin --> (Quản Lý Danh Mục)
    Admin --> (Quản Lý Kho)
    Admin --> (Quản Lý Đơn Hàng)
    (Quản Lý Đơn Hàng) --> (Cập Nhật Trạng Thái) : include
    Admin --> (Quản Lý Khuyến Mãi)
    Admin --> (Xem Thống Kê)
```

---

## 👤 Customer Use Cases (16 use cases)

### 1. Tài Khoản & Xác Thực
- **Đăng Ký**: Tạo tài khoản mới
- **Đăng Nhập**: Đăng nhập vào hệ thống

### 2. Duyệt & Tìm Kiếm (include relationships)
- **Duyệt Sản Phẩm**: Xem danh sách SP
  - include → **Tìm Kiếm**: Tìm kiếm SP theo từ khóa
    - include → **Lọc Danh Mục**: Lọc theo danh mục sản phẩm
    - include → **Lọc Thương Hiệu**: Lọc theo thương hiệu
    - include → **Lọc Platform**: Lọc theo platform game

### 3. Chi Tiết Sản Phẩm
- **Xem Chi Tiết**: Xem thông tin chi tiết của 1 sản phẩm
  - **Viết Đánh Giá**: Viết review sao (1-5 stars)
  - **Viết Bình Luận**: Bình luận về sản phẩm

### 4. Mua Hàng & Thanh Toán (core flow)
- **Thêm Giỏ Hàng**: Add sản phẩm vào giỏ
- **Xem Giỏ Hàng**: Kiểm tra giỏ hàng
  - **Thanh Toán COD**: Thanh toán khi nhận hàng
    - extend → **Xem Đơn Hàng** (nếu thanh toán thành công)
  - **Thanh Toán Momo**: Thanh toán online
    - include → **Hold SP 15'**: Giữ SP 15 phút
    - extend → **Xem Đơn Hàng** (nếu thanh toán thành công)

### 5. Theo Dõi
- **Xem Đơn Hàng**: Xem tất cả đơn hàng của mình
- **Theo Dõi Giao Hàng**: Xem vị trí giao hàng real-time

---

## 👨‍💼 Admin Use Cases (7 use cases)

### 1. Quản Lý Sản Phẩm
- **Quản Lý SP**: CRUD sản phẩm
  - include → **Quản Lý Danh Mục**: Quản lý categories
  - include → **Quản Lý Thương Hiệu**: Quản lý brands

### 2. Quản Lý Bán Hàng
- **Quản Lý Kho**: Cập nhật tồn kho, stock movements
- **Quản Lý Đơn Hàng**: Xem tất cả đơn hàng
  - include → **Cập Nhật Trạng Thái**: Thay đổi status đơn hàng (triggers backend automations)

### 3. Quản Lý Khác
- **Quản Lý Khuyến Mãi**: CRUD khuyến mãi, vouchers
- **Xem Thống Kê**: Dashboard analytics, revenue report

---

## 🔗 Key Relationships

### Include (Bắt buộc / Required)
- Duyệt → Tìm Kiếm
- Tìm Kiếm → Lọc Danh Mục
- Tìm Kiếm → Lọc Thương Hiệu  
- Tìm Kiếm → Lọc Platform
- Thanh Toán Momo → Hold SP 15'
- Quản Lý SP → Quản Lý Danh Mục
- Quản Lý Đơn Hàng → Cập Nhật Trạng Thái

### Extend (Tùy chọn / Optional)
- Thanh Toán COD → Xem Đơn Hàng (nếu thành công)
- Thanh Toán Momo → Xem Đơn Hàng (nếu thành công)

---

## 📊 Thống Kê

| Actor | Số UC | Độ Phức Tạp | Ghi Chú |
|---|---|---|---|
| Customer (Logged In) | 16 | Trung Bình | E-commerce standard |
| Admin | 7 | Cao | Business management |
| **Tổng** | **23** | **Trung Bình** | **Full user flows** |

---

## 🔄 Main User Flows

### Customer Purchase Flow (REQUIRES AUTH)
```
✓ Phải login trước
↓
Duyệt/Tìm Kiếm Sản Phẩm (có lọc)
  → Xem Chi Tiết (có Review/Comment)
  → Thêm Giỏ Hàng
  → Xem Giỏ Hàng
  → Thanh Toán (protected route)
    ├─ COD: Xem Đơn Hàng
    └─ Momo: Hold 15' → Confirm → Xem Đơn Hàng
  → Theo Dõi Giao Hàng
```

### Admin Management Flow
```
Quản Lý Sản Phẩm
  ├─ Quản Lý Danh Mục
  └─ Quản Lý Thương Hiệu

Quản Lý Kho + Đơn Hàng
  → Cập Nhật Trạng Thái
    ↓ (Backend: Email, shipment, inventory update)

Quản Lý Khuyến Mãi + Xem Thống Kê
```

### Backend Automation (Behind the Scenes)
```
Cập Nhật Trạng Thái Đơn Hàng → Checkout Hold Release
                             → Email Notification
                             → Inventory Update
                             → Shipment Creation
```
Payment Callback (Momo)
  → Confirm Payment
  → Update Inventory (RESERVED → SOLD)
  → Send Email
  → Create Shipment (if admin approved)

Timeout (15 minutes)
  → Release Hold
  → Free up RESERVED stock
  → Clean up CheckoutHold records
```

---

## 💾 Cách Xem Diagram

### Option 1: Mermaid Live (Online)
1. Vào: https://mermaid.live
2. paste code mermaid ở trên
3. Sẽ render đẹp diagram

### Option 2: Draw.io
1. Vào: https://draw.io
2. File → Import → Paste code
3. Chỉnh sửa, export PNG/PDF

### Option 3: VS Code Extension
1. Cài extension: "Markdown Preview Mermaid Support"
2. Mở file này bằng Markdown Preview
3. Diagram sẽ render

---

## 📝 Ghi Chú cho Luận Văn

**Accurate %**: ~90% 
- Chính xác phản ánh kiến trúc thực tế
- **KHÔNG hỗ trợ khách vãng lai (guest)** - checkout là protected route
- Tất cả customer phải login trước thanh toán
- System automation (email, hold, inventory) là backend processes, không hiển thị trong diagram

**Điểm cần highlight**:
1. **Authentication Required**: Checkout là protected route - redirect đến login nếu chưa authenticate
2. **2 Main Actors**: Customer (phải login) + Admin  
3. **Payment Methods**: COD (cash on delivery) + Momo (online wallet)
4. **Inventory Tracking**: 3-state system (Available → Reserved → Sold)
5. **User Flows**: 
   - Customer: Linear flow từ browse → purchase → track
   - Admin: Management workflows (products, orders, inventory, promotions, analytics)
6. **Backend Automation**: Trigger từ việc admin update order status (email, shipment, inventory auto-updates)

---

**Tạo ngày**: 2026-04-03  
**Cho bộ môn**: Đồ Án Tốt Nghiệp - WebBanGame  
**Chương**: 2 - Phân Tích Hệ Thống
