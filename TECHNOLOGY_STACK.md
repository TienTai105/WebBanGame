# 🛠️ WebBanGame - Công Nghệ & Công Dụng Chi Tiết

---

## 📊 TỔNG QUAN DỰ ÁN

**WebBanGame** là nền tảng e-commerce hiện đại bán thiết bị gaming xây dựng trên **MERN Stack** (MongoDB, Express, React, Node.js)

**Kiến trúc**: Monorepo 2-layer (Client + Server)
- 🖥️ **Frontend**: React 18 + Vite (Port 5173)
- 🔧 **Backend**: Express.js + Node.js (Port 5000)
- 💾 **Database**: MongoDB

---

## 🔴 CÔNG NGHỆ BACKEND (Server)

### **Core Framework & Language**

| Công Nghệ | Phiên Bản | Công Dụng |
|-----------|----------|----------|
| **Node.js** | 18+ | Runtime JavaScript server-side, xử lý requests HTTP |
| **Express.js** | ^4.18.2 | Framework web, quản lý routes, middleware, API endpoints |
| **TypeScript** | ^5.3.3 | Type-safe JavaScript, phát hiện lỗi compile-time |

### **Database & ORM**

| Công Nghệ | Phiên Bản | Công Dụng |
|-----------|----------|----------|
| **MongoDB** | (Cloud/Local) | NoSQL database, lưu trữ: Products, Orders, Users, Inventory |
| **Mongoose** | ^7.5.0 | ODM (Object Data Modeling), quản lý schemas & relationships MongoDB |

### **Authentication & Security**

| Công Nghệ | Phiên Bản | Công Dụng |
|-----------|----------|----------|
| **JWT** (jsonwebtoken) | ^9.0.2 | Token-based authentication, tạo/verify access & refresh tokens |
| **bcryptjs** | ^2.4.3 | Hash password, so sánh password an toàn (không lưu plaintext) |
| **dotenv** | ^16.3.1 | Quản lý environment variables (.env), bảo vệ API keys |
| **Helmet** | ^7.1.0 | Security middleware, set HTTP headers an toàn |
| **CORS** | ^2.8.5 | Cross-Origin Resource Sharing, cho phép client (5173) gọi server (5000) |
| **Cookie-parser** | ^1.4.6 | Parse httpOnly cookies từ requests, lưu JWT an toàn |

### **Input Validation & Error Handling**

| Công Nghệ | Phiên Bản | Công Dụng |
|-----------|----------|----------|
| **Express-validator** | ^7.0.0 | Validate request body, params, query (email, format, required fields) |

### **File Upload & Cloud Storage**

| Công Nghệ | Phiên Bản | Công Dụng |
|-----------|----------|----------|
| **Multer** | ^2.1.1 | Middleware upload file, xử lý form-data multipart |
| **Cloudinary** | ^2.9.0 | Cloud storage, lưu images sản phẩm, optimize & CDN |

### **Email & Notification**

| Công Nghệ | Phiên Bản | Công Dụng |
|-----------|----------|----------|
| **Nodemailer** | ^6.10.1 | Gửi email, order confirmation, OTP, status updates qua Gmail SMTP |

### **Real-time Communication**

| Công Nghệ | Phiên Bản | Công Dụng |
|-----------|----------|----------|
| **Socket.io** | ^4.8.3 | WebSocket real-time, live chat, order notifications, inventory updates |

### **Scheduling & Automation**

| Công Nghệ | Phiên Bản | Công Dụng |
|-----------|----------|----------|
| **node-cron** | ^4.2.1 | Cron jobs tự động, release checkout holds hết hạn, cleanup expired orders |

### **Utilities & Helpers**

| Công Nghệ | Phiên Bản | Công Dụng |
|-----------|----------|----------|
| **axios** | ^1.6.0 | HTTP client, gọi external APIs (thanh toán MoMo, VNPay) |
| **nanoid** | ^5.1.7 | Generate unique IDs ngắn, order codes, transaction IDs |
| **morgan** | ^1.10.0 | HTTP request logger, log tất cả API calls |

### **Development & Testing**

| Công Nghệ | Phiên Bản | Công Dụng |
|-----------|----------|----------|
| **tsx** | ^4.7.0 | TypeScript executor, chạy .ts files trực tiếp |
| **Jest** | ^29.7.0 | Unit testing framework, viết tests cho services & controllers |
| **Supertest** | ^6.3.3 | HTTP assertion library, test API endpoints |
| **Nodemon** | ^3.0.2 | Auto-restart server khi files thay đổi (development) |

### **Type Definitions**

```
@types/bcryptjs, @types/express, @types/mongoose, 
@types/morgan, @types/multer, @types/nanoid, 
@types/node, @types/node-cron, @types/nodemailer
```

---

## 🔵 CÔNG NGHỆ FRONTEND (Client)

### **Core Framework & Language**

| Công Nghệ | Phiên Bản | Công Dụng |
|-----------|----------|----------|
| **React** | ^18.2.0 | UI library, component-based architecture |
| **React-DOM** | ^18.2.0 | Render React components to DOM |
| **Vite** | ^5.0.8 | Build tool & dev server tốc độ cao (thay cho Webpack) |
| **TypeScript** | ^5.3.3 | Type-safe JavaScript frontend |

### **Routing & Navigation**

| Công Nghệ | Phiên Bản | Công Dụng |
|-----------|----------|----------|
| **React-router-dom** | ^6.20.0 | Client-side routing, navigate pages (Home, Products, Orders) |

### **State Management**

| Công Nghệ | Phiên Bản | Công Dụng |
|-----------|----------|----------|
| **Zustand** | ^4.5.7 | Lightweight state management, cart, auth, filters state |
| **Context API** | (Built-in) | Pass props down tree, theme, user context |

### **Data Fetching & Caching**

| Công Nghệ | Phiên Bản | Công Dụng |
|-----------|----------|----------|
| **Axios** | ^1.6.0 | HTTP client, fetch từ API backend |
| **@tanstack/react-query** | ^5.90.21 | Server state management, cache API responses, auto-refetch |
| **@tanstack/react-query-devtools** | ^5.91.3 | Debug React Query, inspect cache, requests |

### **Form Handling & Validation**

| Công Nghệ | Phiên Bản | Công Dụng |
|-----------|----------|----------|
| **React-hook-form** | ^7.48.0 | Efficient form handling, minimal re-renders |
| **@hookform/resolvers** | ^5.2.2 | Integration with validation schemas (Yup, Zod) |
| **Yup** | ^1.7.1 | Schema validation (backup), validate form data |
| **Zod** | ^3.22.4 | TypeScript-first schema validation, email, password rules |

### **Styling & UI Components**

| Công Nghệ | Phiên Bản | Công Dụng |
|-----------|----------|----------|
| **Tailwind CSS** | ^3.3.6 | Utility-first CSS framework, responsive design |
| **PostCSS** | ^8.4.32 | Process CSS, support nested rules, vendor prefixes |
| **Autoprefixer** | ^10.4.16 | Add browser vendor prefixes (-webkit, -moz) |
| **tailwind-merge** | ^3.5.0 | Merge Tailwind classes, resolve conflicts |
| **clsx** | ^2.1.1 | Conditional CSS classes, dynamic className |
| **class-variance-authority** | ^0.7.1 | Component variants system, button variants, states |

### **UI Components & Icons**

| Công Nghệ | Phiên Bản | Công Dụng |
|-----------|----------|----------|
| **@radix-ui/** | ^1.3.x | Headless UI components (Checkbox, Slider, Radio) |
| **lucide-react** | ^0.577.0 | SVG icon library, 1000+ icons |

### **Charts & Data Visualization**

| Công Nghệ | Phiên Bản | Công Dụng |
|-----------|----------|----------|
| **recharts** | ^3.8.1 | React charts, dashboard graphs (sales, inventory) |

### **Real-time Communication**

| Công Nghệ | Phiên Bản | Công Dụng |
|-----------|----------|----------|
| **socket.io-client** | ^4.8.3 | WebSocket client, listen real-time notifications |

### **Date & Time**

| Công Nghệ | Phiên Bản | Công Dụng |
|-----------|----------|----------|
| **react-datepicker** | ^9.1.0 | Date picker component, chọn ngày tháng năm |

### **Notifications & UI Feedback**

| Công Nghệ | Phiên Bản | Công Dụng |
|-----------|----------|----------|
| **react-toastify** | ^11.0.5 | Toast notifications, success/error/warning messages |

### **Rich Text Editing**

| Công Nghệ | Phiên Bản | Công Dụng |
|-----------|----------|----------|
| **Quill** | ^2.0.3 | Rich text editor library |
| **react-quill** | ^2.0.0 | React wrapper cho Quill, edit descriptions, news |
| **dompurify** | ^3.3.3 | Sanitize HTML, xóa XSS attacks trong editor |

### **Development Tools**

| Công Nghệ | Phiên Bản | Công Dụng |
|-----------|----------|----------|
| **@vitejs/plugin-react** | ^4.2.1 | React plugin cho Vite, Fast Refresh, HMR |
| **@types/react, @types/react-dom** | ^18.2.x | TypeScript definitions cho React |

---

## 🌐 DEVOPS & DEPLOYMENT

| Công Nghệ | Công Dụng |
|----------|----------|
| **Docker** | Container hóa ứng dụng, docker-compose.yml quản lý MongoDB + Services |
| **npm/concurrently** | Run client + server concurrently (`npm run dev`) |
| **Git** | Version control, track changes |

---

## 📡 EXTERNAL SERVICES & APIs

| Dịch Vụ | Công Dụng |
|--------|----------|
| **MongoDB Atlas** | Cloud database hosting |
| **Cloudinary** | Image storage & CDN |
| **Gmail SMTP** | Email sending via Nodemailer |
| **MoMo API** | Payment gateway (giả lập) |
| **VNPay API** | Payment gateway (optional) |
| **Socket.io Server** | Real-time communication |

---

## 🏗️ KIẾN TRÚC HỆ THỐNG TỔNG QUAN

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (React + Vite)                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Zustand (State) → React Query (Data) → Components   │  │
│  │  React Router → Pages → Tailwind UI                  │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │ Axios / Socket.io
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (Express.js + TypeScript)              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Routes → Controllers → Services → Models            │  │
│  │  ├─ Auth (JWT, OAuth)                                │  │
│  │  ├─ Products (CRUD, Filter, Search)                  │  │
│  │  ├─ Orders (Create, Update, Cancel)                  │  │
│  │  ├─ Inventory (Reserve, Confirm, Release)            │  │
│  │  ├─ Payments (Momo, VNPay Integration)               │  │
│  │  ├─ Admin (Dashboard, Reports)                       │  │
│  │  └─ Socket.io (Real-time Events)                     │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │ Mongoose ODM
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                  MongoDB (Database)                         │
│  Collections: Users, Products, Orders, Inventory, etc      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 KEY FEATURES & TECHNOLOGY MAPPING

| Feature | Frontend Tech | Backend Tech | Database |
|---------|---------------|--------------|----------|
| **Authentication** | React-router, Context | JWT, bcryptjs | Users collection |
| **Product Listing** | React-query, Zustand | Express routes, Mongoose | Products collection |
| **Shopping Cart** | Zustand state | Session/localStorage | (Client-side by default) |
| **Checkout** | React-hook-form, Zod | Inventory service | Orders, Inventory |
| **Payment** | Axios | MoMo/VNPay APIs | Payment collection |
| **Order Management** | React-query + Socket.io | Express controllers | Orders collection |
| **Inventory Tracking** | Recharts | node-cron jobs | StockMovement logs |
| **Email Notifications** | React-toastify | Nodemailer | (Email service) |
| **Real-time Updates** | socket.io-client | socket.io | (Live events) |
| **Admin Dashboard** | Recharts, React Query | Express admin routes | Multiple collections |

---

## 🔧 WORKFLOW CHÍNH

### 1️⃣ **Product Browsing**
```
User → React Components (Tailwind UI)
     → React-query (fetch from API)
     → Zustand (store filters)
     → Express Backend (query MongoDB)
     → Return paginated products → Display
```

### 2️⃣ **Add to Cart**
```
Click Button → Zustand cart state update
            → React re-render
            → (Optional: save to localStorage)
```

### 3️⃣ **Checkout & Payment**
```
React-hook-form (validate)
  → Axios POST /checkout
  → Express controller (create order)
  → Mongoose create Order document
  → Inventory service (reserve stock)
  → MoMo/VNPay API call
  → Return status
  → Zustand clear cart
  → React Toast notification
  → MongoDB update order (paid/unpaid)
```

### 4️⃣ **Real-time Order Updates**
```
Admin updates order status in Admin Panel
  → Express socket.emit
  → Socket.io broadcast to client
  → React component updates
  → Toast notification appears
  → Nodemailer sends email to customer
```

### 5️⃣ **Scheduled Tasks**
```
node-cron job runs every 15 minutes
  → Check expired checkout holds
  → Release reserved stock
  → MongoDB update Inventory
  → Log to StockMovement collection
```

---

## 📊 DATA FLOW EXAMPLE: Order Creation

```
FRONTEND (5173):
┌─────────────────────────────────────┐
│ 1. User clicks "Xác nhận đơn hàng"   │
│    ↓                                │
│ 2. React-hook-form validates        │
│    ↓                                │
│ 3. Axios POST /api/orders           │
│    ↓                                │
│ 4. Zustand clears cart              │
└─────────────────────────────────────┘
         ↓ NETWORK
BACKEND (5000):
┌─────────────────────────────────────┐
│ 1. Express receives POST request     │
│    ↓                                │
│ 2. orderController.createOrder()    │
│    ↓                                │
│ 3. inventoryService.reserveStock()  │
│    - Check MongoDB Inventory        │
│    - Update available → reserved    │
│    ↓                                │
│ 4. Order.create() → MongoDB         │
│    ↓                                │
│ 5. Nodemailer sends confirmation    │
│    ↓                                │
│ 6. socket.io emit to admin          │
│    ↓                                │
│ 7. Return 201 + order data          │
└─────────────────────────────────────┘
         ↓ NETWORK
FRONTEND (5173):
┌─────────────────────────────────────┐
│ 1. Receive 201 response             │
│    ↓                                │
│ 2. React-toastify toast success     │
│    ↓                                │
│ 3. Navigate to /order-confirm       │
│    ↓                                │
│ 4. Display order summary            │
└─────────────────────────────────────┘
```

---

## 🎯 TECHNOLOGY SELECTION RATIONALE

| Công Nghệ | Lý Do Chọn |
|-----------|-----------|
| **MERN Stack** | Flexible, full-stack JavaScript, large ecosystem |
| **TypeScript** | Type safety, better IDE support, fewer runtime errors |
| **Tailwind CSS** | Rapid UI development, consistent design system |
| **React-query** | Efficient server state, cache management, reduces boilerplate |
| **Zustand** | Lightweight state, no provider hell, easy to use |
| **Socket.io** | Real-time features, fallback to polling if needed |
| **Mongoose** | Schema validation, hooks, migration tools for MongoDB |
| **JWT** | Stateless authentication, scalable, secure token-based |
| **Nodemailer** | Easy email, Gmail free tier, no cost |

---

## 🚀 PRODUCTION CONSIDERATIONS

| Aspect | Current Setup | Production |
|--------|---------------|-----------|
| **Database** | MongoDB Atlas free | Paid tier / Sharded cluster |
| **Images** | Cloudinary free | Cloudinary paid / AWS S3 |
| **Email** | Gmail SMTP | SendGrid / AWS SES |
| **Socket.io** | In-memory | Redis adapter / Socket.io server |
| **Logging** | Morgan console | ELK Stack / DataDog |
| **Monitoring** | None | New Relic / Sentry |
| **Deployment** | Local Docker | Heroku / Railway / AWS |

---

## 📚 DEPENDENCIES SUMMARY

**Total npm packages: ~60+**

- **Backend**: 23 dependencies + 15 devDependencies
- **Frontend**: 21 dependencies + 10 devDependencies
- **Root**: concurrently + shared utilities

---

Hy vọng tài liệu này giúp bạn hiểu rõ toàn bộ công nghệ trong WebBanGame! 🚀
