# 🎮 LUỒNG XỬ LÝ CLIENT - WEBBAN GAME

## 📊 TỔNG QUAN KIẾN TRÚC

```
┌─────────────────────────────────────────────────────────────────┐
│                        UI LAYER (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Home.tsx     │  │ Login.tsx    │  │ Register.tsx │          │
│  │ ProductPage  │  │ CartPage     │  │ CheckoutPage │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└────────────────────────┬─────────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────────┐
│                   COMPONENTS LAYER                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Header.tsx   │  │ ProductCard  │  │ Form Inputs  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└────────────────────────┬─────────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────────┐
│              STATE MANAGEMENT LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Zustand      │  │ Zustand      │  │ Zustand      │          │
│  │ authStore.ts │  │ cartStore.ts │  │ uiStore.ts   │          │
│  │ (xác thực)   │  │ (giỏ hàng)   │  │ (giao diện)  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  ┌──────────────────────────────────────────────────────┐       │
│  │   TanStack Query (React Query)                       │       │
│  │   - Lưu cache dữ liệu sản phẩm                       │       │
│  │   - Tự động refetch khi cần                          │       │
│  │   - Quản lý loading, error                           │       │
│  └──────────────────────────────────────────────────────┘       │
└────────────────────────┬─────────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────────┐
│              SERVICES & HOOKS LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ services/    │  │ hooks/       │  │ utils/       │          │
│  │ api.ts       │  │ queries.ts   │  │ helpers.ts   │          │
│  │ index.ts     │  │              │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└────────────────────────┬─────────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────────┐
│                   AXIOS API CLIENT                               │
│  - Interceptors: thêm token vào header                           │
│  - Xử lý lỗi tự động (403, 401, 500)                            │
│  - Refresh token nếu hết hạn                                    │
└────────────────────────┬─────────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────────┐
│                   BACKEND API                                    │
│              http://localhost:5000                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 CHI TIẾT TỪNG GIAI ĐOẠN LUỒNG XỬ LÝ

### 1️⃣ **GIA ĐOẠN KHỞI ĐỘNG (INITIALIZATION)**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. KHỞI ĐỘNG ỨNG DỤNG                                      │
└─────────────────────────────────────────────────────────────┘

Browser Load → main.tsx
    ↓
1. Tạo QueryClient (TanStack Query)
   - Cấu hình default options
   - staleTime: 5 phút (dữ liệu tươi bao lâu)
   - retry: 1 lần (thử lại nếu lỗi)
   - refetchOnWindowFocus: true (refetch khi tab active)
   
2. Wrap App với QueryClientProvider
   - Cung cấp QueryClient cho tất cả hook
   
3. Import CSS Tailwind
   
4. Render ứng dụng vào <root> element
```

**File: `src/main.tsx`**
```typescript
// Bước 1: Tạo QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,                           // Thử lại 1 lần nếu lỗi
      refetchOnWindowFocus: true,        // Refetch khi user quay lại tab
      staleTime: 5 * 60 * 1000,          // 5 phút dữ liệu được coi là "tươi"
    },
  },
})

// Bước 2: Render App với Provider
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>  {/* Cung cấp QueryClient */}
      <App />
    </QueryClientProvider>
  </React.StrictMode>
)
```

---

### 2️⃣ **GIA ĐOẠN ROUTING & LAYOUT**

```
┌─────────────────────────────────────────────────────────────┐
│ 2. XÁC ĐỊNH ROUTE VÀ LAYOUT                                │
└─────────────────────────────────────────────────────────────┘

App.tsx (Router setup)
    ↓
├─ Header (tất cả trang dùng chung)
│  └─ Hiển thị logo, menu, auth info
│
└─ Routes
   ├─ "/" → Home.tsx (trang chủ bán hàng)
   ├─ "/login" → Login.tsx (đăng nhập)
   └─ "/register" → Register.tsx (đăng ký)
   └─ "/cart" → Cart.tsx (giỏ hàng)
   └─ "/product/:id" → ProductDetail.tsx
```

**File: `src/App.tsx`**
```typescript
function App() {
  return (
    <Router>                              {/* React Router quản lý điều hướng */}
      <Header />                          {/* Component chung cho tất cả trang */}
      <main className="min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
    </Router>
  )
}
```

---

### 3️⃣ **GIA ĐOẠN LẤY DỮ LIỆU (DATA FETCHING)**

```
┌─────────────────────────────────────────────────────────────┐
│ 3. LẤY DỮ LIỆU TỪMACHINE BACKEND                           │
└─────────────────────────────────────────────────────────────┘

Trang Home.tsx muốn lấy danh sách sản phẩm hot
    ↓
1. Gọi hook: useTrendingProducts(8)
   
2. Hook này gọi TanStack Query:
   const { data, isLoading, error } = useQuery({
     queryKey: ['products', 'trending', 8],  // Unique key cho cache
     queryFn: () => productService.getTrendingProducts(8),  // Hàm lấy dữ liệu
     staleTime: 10 * 60 * 1000,  // Tươi trong 10 phút
   })
   
3. TanStack Query tự động:
   ✓ Kiểm tra cache (nếu dữ liệu tồn tại & tươi → dùng ngay)
   ✓ Nếu không → gọi API
   ✓ Lưu kết quả vào cache
   ✓ Trả về { data, isLoading, error }
   
4. Component render:
   - Nếu isLoading → hiển thị "Loading..."
   - Nếu error → hiển thị "Error loading products"
   - Nếu data → hiển thị danh sách sản phẩm
```

**File: `src/hooks/queries/useProducts.ts`**
```typescript
// Hook này quản lý lấy dữ liệu trending products
export const useTrendingProducts = (limit: number = 10) => {
  return useQuery({
    queryKey: ['products', 'trending', limit],  // Cache key
    
    queryFn: () =>
      // Gọi API backend
      productService.getTrendingProducts(limit)
        .then((res) => res.data.data),           // Extract dữ liệu từ response
    
    staleTime: 10 * 60 * 1000,                   // Lưu cache 10 phút
  })
}
```

**File: `src/pages/Home.tsx`**
```typescript
const Home = () => {
  // Hook tự động fetch dữ liệu, cache và refetch
  const { data, isLoading, error } = useTrendingProducts(8)
  
  // Xử lý các trạng thái
  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage />
  
  // Hiển thị dữ liệu
  const trendingProducts = data?.products || []
  return (
    <div className="grid grid-cols-4 gap-6">
      {trendingProducts.map(product => 
        <ProductCard key={product._id} product={product} />
      )}
    </div>
  )
}
```

---

### 4️⃣ **GIA ĐOẠN QUẢN LÝ TRẠNG THÁI (STATE MANAGEMENT)**

```
┌─────────────────────────────────────────────────────────────┐
│ 4. QUẢN LÝ TRẠNG THÁI VỚI ZUSTAND                          │
└─────────────────────────────────────────────────────────────┘

🔐 authStore (Xác thực)
├─ state:
│  ├─ user: User | null
│  ├─ isAuthenticated: boolean
│  ├─ isLoading: boolean
│  └─ error: string | null
├─ actions:
│  ├─ login(email, password)
│  ├─ register(email, password, name)
│  ├─ logout()
│  └─ clearError()
└─ persist: Lưu user & isAuthenticated vào localStorage

🛒 cartStore (Giỏ hàng)
├─ state:
│  ├─ items: { id, name, price, quantity }[]
│  └─ total: number
├─ actions:
│  ├─ addItem(product)
│  ├─ removeItem(productId)
│  ├─ updateQuantity(productId, quantity)
│  ├─ clearCart()
│  └─ calculateTotal()
└─ persist: Lưu tất cả vào localStorage (tự động)

🎨 uiStore (Giao diện)
├─ state:
│  ├─ sidebarOpen: boolean
│  └─ theme: 'light' | 'dark'
├─ actions:
│  ├─ toggleSidebar()
│  ├─ toggleTheme()
│  └─ closeSidebar()
└─ persist: KHÔNG lưu (reset mỗi lần reload)
```

**File: `src/stores/authStore.ts`**
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      // ===== STATE =====
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      // ===== ACTIONS =====
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authService.login({ email, password })
          set({
            user: response.data.data.user,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({ error: error.message, isLoading: false })
        }
      },
      
      logout: () => {
        set({ user: null, isAuthenticated: false })
        localStorage.removeItem('token')
      },
      
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',  // Key in localStorage
      partialize: (state) => ({  // Chỉ lưu những này
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
```

**Cách sử dụng trong component:**
```typescript
const Login = () => {
  const { login, isLoading, error } = useAuthStore()
  
  const handleLogin = async (email: string, password: string) => {
    await login(email, password)  // Store tự động cập nhật
    // User sẽ được persist sang localStorage
  }
}
```

---

### 5️⃣ **GIA ĐOẠN XỬ LÝ FORM & VALIDATION**

```
┌─────────────────────────────────────────────────────────────┐
│ 5. LÀM VIỆC VỚI FORM (Login, Register)                    │
└─────────────────────────────────────────────────────────────┘

User điền form & nhấn Submit
    ↓
1. React Hook Form bắt sự kiện form
   - Kiểm tra validation quy tắc
   - Hiển thị lỗi nhập liệu
   
2. Nếu hợp lệ → gọi onSubmit
   
3. onSubmit gọi authStore.login()
   
4. Login action:
   - Gọi API → authService.login(email, password)
   - Axios gửi request tới backend
   - Backend kiểm tra email/password
   - Trả về token & user info
   
5. Lưu lại:
   - accessToken → localStorage
   - refreshToken → httpOnly cookie (tự động)
   - user → authStore.user (persist)
   
6. Redirect tới Home (đã login)
```

**File: `src/pages/Login.tsx`**
```typescript
import { useForm } from 'react-hook-form'
import { useAuthStore } from '../stores/authStore'

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const { login, isLoading, error } = useAuthStore()
  
  const onSubmit = async (data: any) => {
    await login(data.email, data.password)
    // Zustand tự động navigate/update
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('email', {
          required: 'Email required',
          pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i }
        })}
        placeholder="Email"
      />
      {errors.email && <span>{errors.email.message}</span>}
      
      <input
        {...register('password', { required: 'Password required' })}
        type="password"
        placeholder="Password"
      />
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}
```

---

### 6️⃣ **GIA ĐOẠN API COMMUNICATION**

```
┌─────────────────────────────────────────────────────────────┐
│ 6. GIAO TIẾP VỚI BACKEND                                   │
└─────────────────────────────────────────────────────────────┘

Browser
    ↓
Axios Request Interceptor (thêm token)
    ├─ GET Authorization header từ localStorage
    ├─ Thêm: Authorization: Bearer {token}
    └─ Gửi request đi
    
    ↓
Backend nhận request
    ├─ Kiểm tra token
    ├─ Xử lý logic
    └─ Trả lại response
    
    ↓
Axios Response Interceptor (xử lý lỗi)
    ├─ Nếu 401 (token hết hạn)
    │  ├─ Dùng refreshToken để lấy token mới
    │  ├─ Retry request ban đầu
    │  └─ Trả lại kết quả
    ├─ Nếu 403 (forbidden)
    │  └─ Logout user
    ├─ Nếu 500 (server error)
    │  └─ Hiển thị error message
    └─ Nếu 200 OK
       └─ Trả lại dữ liệu
```

**File: `src/services/api.ts`**
```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
})

// REQUEST INTERCEPTOR: Thêm token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// RESPONSE INTERCEPTOR: Xử lý lỗi
api.interceptors.response.use(
  (response) => response,  // OK
  async (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn → làm mới
      const newToken = await refreshAccessToken()
      localStorage.setItem('accessToken', newToken)
      return api(error.config)  // Thử lại request
    }
    return Promise.reject(error)
  }
)

export default api
```

---

### 7️⃣ **GIA ĐOẠN CACHING & PERFORMANCE**

```
┌─────────────────────────────────────────────────────────────┐
│ 7. LƯU CACHE & TỐI ƯU HIỆU NĂNG                           │
└─────────────────────────────────────────────────────────────┘

TanStack Query Cache Strategy:
├─ Fresh (Tươi)
│  └─ Dữ liệu vừa fetch, dùng ngay không call API
│
├─ Stale (Cũ)
│  ├─ Dữ liệu quá thời gian staleTime
│  ├─ Vẫn dùng được nhưng sẽ refetch background
│  └─ Sau 5-10 phút sẽ refetch
│
└─ Inactive (Không dùng)
   ├─ Hết thời gian gcTime (garbage collect)
   └─ Sẽ xóa khỏi memory

Ví dụ thực tế:
Time 0:00   → Call useTrendingProducts(8)
             → API fetch → Cache store
             → isFresh = true
             
Time 5:00   → Component vẫn dùng hook
             → Dữ liệu tươi, dùng cache
             → Không call API (tiết kiệm!)
             
Time 10:01  → Vượt quá staleTime 10 phút
             → isStale = true
             → Background refetch (user không biết)
             → Update dữ liệu mới
             
Time 15:00  → Component unmount
             → Không dùng → gcTime countdown
             → Sau 5 phút sẽ xóa khỏi cache
```

**Cấu hình cache cho từng loại dữ liệu:**

```typescript
// Products → để lâu (sáng, trưa, tối)
export const useProducts = (page: number = 1) => 
  useQuery({
    queryKey: ['products', page],
    queryFn: () => productService.getProducts({ page }),
    staleTime: 5 * 60 * 1000,      // Tươi 5 phút
    gcTime: 10 * 60 * 1000,        // Xóa sau 10 phút không dùng
  })

// User info → thường xuyên check (đặc biệt sau login)
export const useCurrentUser = () =>
  useQuery({
    queryKey: ['user', 'current'],
    queryFn: () => authService.getCurrentUser(),
    staleTime: 2 * 60 * 1000,      // Tươi 2 phút
    gcTime: 5 * 60 * 1000,         // Xóa sau 5 phút
  })

// Order history → ít thay đổi
export const useOrderHistory = () =>
  useQuery({
    queryKey: ['orders', 'history'],
    queryFn: () => orderService.getHistory(),
    staleTime: 30 * 60 * 1000,     // Tươi 30 phút
    gcTime: 60 * 60 * 1000,        // Xóa sau 1 giờ
  })
```

---

## 🎯 PHƯƠNG PHÁP ÁP DỤNG HIỆU QUẢ

### 💡 **Best Practice 1: Tổ chức folder chuẩn**

```
client/src/
├── pages/                    # Trang chính (Route)
│   ├── Home.tsx
│   ├── Login.tsx
│   ├── Cart.tsx
│   ├── ProductDetail.tsx
│   └── Checkout.tsx
│
├── components/               # Các component tái sử dụng
│   ├── Header.tsx
│   ├── ProductCard.tsx
│   ├── Button.tsx
│   ├── Form/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   └── Common/
│       ├── Loading.tsx
│       └── ErrorBoundary.tsx
│
├── stores/                   # Zustand stores (State management)
│   ├── authStore.ts
│   ├── cartStore.ts
│   └── uiStore.ts
│
├── hooks/                    # Custom hooks
│   ├── queries/             # TanStack Query hooks
│   │   └── useProducts.ts
│   └── useLocalStorage.ts
│
├── services/                 # API calls
│   ├── api.ts               # Axios config
│   └── index.ts             # Các service functions
│
├── utils/                    # Helper functions
│   ├── formatPrice.ts
│   ├── validators.ts
│   └── constants.ts
│
├── types/                    # TypeScript interfaces
│   └── index.ts
│
├── App.tsx
├── main.tsx
└── index.css
```

---

### 💡 **Best Practice 2: Cách gọi Zustand store**

```typescript
// ❌ SAI: Gọi trong mỗi render = tạo object mới liên tục
const Component = () => {
  const store = useAuthStore()  // Mỗi render tạo object mới
}

// ✅ ĐÚNG: Selector cụ thể để tránh re-render không cần thiết
const Component = () => {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  // Chỉ re-render khi user hoặc logout thay đổi
}

// ✅ TỐTOP: Dùng shallow selector nếu nhiều state
const Component = () => {
  const { user, isAuthenticated, logout } = useAuthStore(
    (state) => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      logout: state.logout,
    })
  )
}
```

---

### 💡 **Best Practice 3: Xử lý Error & Loading**

```typescript
// ❌ SAI: Không xử lý lỗi
const Component = () => {
  const { data } = useQuery({...})
  return <div>{data.name}</div>  // Crash nếu data null/undefined
}

// ✅ ĐÚNG: Xử lý tất cả trạng thái
const Component = () => {
  const { data, isLoading, error } = useQuery({...})
  
  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  if (!data) return <EmptyState />
  
  return <div>{data.name}</div>
}
```

---

### 💡 **Best Practice 4: API Types & Response**

```typescript
// services/index.ts - Definition

export interface LoginRequest {
  email: string
  password: string
}

export interface User {
  _id: string
  name: string
  email: string
  role: 'user' | 'admin'
  avatar?: string
}

export interface AuthResponse {
  data: {
    user: User
    accessToken: string
    refreshToken: string
  }
}

// ✅ Cách gọi type-safe
const loginService = (credentials: LoginRequest): Promise<AxiosResponse<AuthResponse>> =>
  api.post('/auth/login', credentials)

// Khi sử dụng
const response = await loginService({ email: '...', password: '...' })
const user: User = response.data.data.user  // TypeScript biết type
```

---

### 💡 **Best Practice 5: Dependency Injection cho Performance**

```typescript
// ❌ CHẬM: Tạo object mỗi render
export const useProductQuery = (id: string) => {
  const filters = { sort: 'newest', limit: 10 }  // Mỗi render khác object
  return useQuery({
    queryKey: ['product', id, filters],  // Cache key thay đổi
    queryFn: () => getProduct(id, filters),
  })
}

// ✅ NHANH: Tách state ra, memo key
export const useProductQuery = (id: string) => {
  return useQuery({
    queryKey: ['product', id],  // Ổn định
    queryFn: () => getProduct(id, { sort: 'newest', limit: 10 }),
  })
}

// ✅ TỐTOP: State lưu trong store nếu dùng lâu dài
const useStore = create((set) => ({
  filters: { sort: 'newest', limit: 10 },
}))

export const useProductQuery = (id: string) => {
  const filters = useStore((state) => state.filters)
  return useQuery({
    queryKey: ['product', id, filters],
    queryFn: () => getProduct(id, filters),
  })
}
```

---

### 💡 **Best Practice 6: Invalidate Cache khi Submit**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'

const ProductForm = () => {
  const queryClient = useQueryClient()
  
  // Mutation để submit form
  const { mutate: addProduct, isPending } = useMutation({
    mutationFn: (newProduct) => productService.create(newProduct),
    
    onSuccess: () => {
      // ✅ QUAN TRỌNG: Xóa cache cũ để fetch lại
      queryClient.invalidateQueries({ 
        queryKey: ['products']  // Sẽ refetch ngay
      })
    },
  })
  
  const handleSubmit = (formData) => {
    addProduct(formData)
  }
  
  return <form onSubmit={handleSubmit}>...</form>
}
```

---

### 💡 **Best Practice 7: Logout & Cleanup**

```typescript
// stores/authStore.ts
export const useAuthStore = create((set) => ({
  logout: () => {
    // 1. Clear stores
    set({ user: null, isAuthenticated: false })
    
    // 2. Clear localStorage
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    
    // 3. Clear cookies
    document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC;'
    
    // 4. Xóa cache API (trong component)
    // - queryClient.clear()
    
    // 5. Navigate
    // - navigate('/login')
  }
}))

// Trong component
const Header = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const logout = useAuthStore(state => state.logout)
  
  const handleLogout = () => {
    logout()
    queryClient.clear()  // Xóa tất cả cache
    navigate('/login')
  }
}
```

---

## 📋 CHECKLIST IMPLEMENTATION

```
Client-side Setup:
✅ main.tsx: QueryClientProvider + Config
✅ App.tsx: Router + Layout
✅ stores/: 3 Zustand stores (auth, cart, ui)
✅ hooks/queries/: TanStack Query hooks
✅ services/api.ts: Axios + Interceptors
✅ pages/: Home, Login, Register, Cart (chuẩn bị)
✅ components/: Header, ProductCard, Forms

Performance Optimization:
✅ Caching: staleTime, gcTime
✅ Pagination: Lazy load products
✅ Memoization: useMemo cho data transform
✅ Code splitting: React.lazy cho pages
✅ Bundle: Import chỉ cần thiết

Security:
✅ Token: Lưu securely (localStorage + httpOnly)
✅ Validation: React Hook Form + Zod
✅ CORS: Backend config
✅ HTTPS: Production only
✅ XSS: Sanitize user input

Testing (Next phase):
⏳ Unit: Jest + React Testing Library
⏳ Integration: MSW (Mock Service Worker)
⏳ E2E: Playwright hoặc Cypress
```

---

## 🚀 TÓMLỢI WORKFLOW GIẢI QUYẾT SỰ CỐ

### Khi có lỗi trong ứng dụng:

**1. User thấy lỗi → Browser console**
```
Error location → src/pages/Home.tsx ?
                → src/components/ProductCard.tsx ?
                → src/hooks/queries/useProducts.ts ?
                → src/stores/authStore.ts ?
```

**2. Theo dõi React DevTools**
```
- Kiểm tra component tree
- Trace component re-render (React DevTools Profiler)
- Xem props & state
```

**3. Kiểm tra Zustand DevTools**
```
- XemonHere store state
- Xem action history
- Time-travel debugging
```

**4. Kiểm tra Network (F12 → Network tab)**
```
- API request có gửi đi không?
- Response status code gì? (200, 401, 500?)
- Response body có dữ liệu không?
```

**5. Kiểm tra localStorage**
```javascript
// Console
localStorage.getItem('accessToken')        // Token có không?
JSON.parse(localStorage.getItem('auth-storage'))  // User data có không?
```

---

## 📚 TÀI LIỆU THAM KHẢO

| Thư viện | URL | Mục đích |
|----------|-----|---------|
| React Hook Form | https://react-hook-form.com | Form handling + validation |
| TanStack Query | https://tanstack.com/query | Server state management |
| Zustand | https://github.com/pmndrs/zustand | Client state management |
| Zod | https://zod.dev | Schema validation |
| React Router | https://reactrouter.com | Page routing |
| Axios | https://axios-http.com | HTTP client |
| Tailwind CSS | https://tailwindcss.com | Styling |

---

**Cập nhật: 25/02/2026**
**Status: ✅ Client Architecture Complete & Ready for Week 2 Development**
