import api from './api'
import { AxiosResponse } from 'axios'

// Type definitions
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  confirmPassword: string
  phone?: string
}

export interface AuthResponse {
  data: {
    user: {
      _id: string
      name: string
      email: string
      role: 'user' | 'admin'
      avatar?: string
    }
    accessToken: string
  }
}

export interface ProductImage {
  url: string
  cloudinaryId?: string
  alt?: string
  isMain?: boolean
}

export interface ProductVariant {
  _id?: string
  sku: string
  name: string
  attributes?: Record<string, any>
  images?: ProductImage[]
  price: number
  cost: number
  discount: number
  finalPrice: number
  stock?: number
  status: 'active' | 'inactive' | 'discontinued'
}

export interface MultiplayerInfo {
  isMultiplayer: boolean
  minPlayers?: number
  maxPlayers?: number
  modes?: string[]
}

export interface ProductResponse {
  _id: string
  name: string
  slug: string
  description: string
  sku: string
  categoryId: {
    _id: string
    name: string
  } | string  // string for backward compatibility
  price?: number
  cost?: number
  discount?: number
  finalPrice?: number
  minPrice: number
  maxPrice: number
  stock?: number  // top-level stock for products without variants
  variants?: ProductVariant[]
  images?: ProductImage[]
  specifications?: Record<string, any>
  tags?: string[]
  videoTrailerUrl?: string  // YouTube video URL
  multiplayer?: MultiplayerInfo
  brand?: string  // ref to Brand
  platforms?: string[]  // ref to Platforms
  genres?: string[]  // ref to Genres
  ratingAverage?: number
  ratingCount?: number
  soldCount?: number
  ratings?: Array<{
    userId: string
    rating: number
  }>
  isActive?: boolean
  views?: number
  createdAt?: string
  updatedAt?: string
}

export interface ProductsListResponse {
  data: {
    products: ProductResponse[]
    total: number
    page: number
    limit: number
  }
}

export const authService = {
  register: (data: RegisterRequest): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/auth/register', data),
  login: (data: LoginRequest): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/auth/login', data),
  logout: (): Promise<AxiosResponse> => api.post('/auth/logout'),
  getCurrentUser: (): Promise<AxiosResponse<AuthResponse>> =>
    api.get('/auth/me'),
  refreshToken: (): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/auth/refresh-token'),
}

export const productService = {
  getProducts: (params?: Record<string, any>): Promise<AxiosResponse<ProductsListResponse>> =>
    api.get('/products', { params }),
  getProductById: (id: string): Promise<AxiosResponse<{ data: ProductResponse }>> =>
    api.get(`/products/${id}`),
  getProductsByCategory: (
    category: string,
    limit?: number
  ): Promise<AxiosResponse<ProductsListResponse>> =>
    api.get(`/products/category/${category}`, { params: { limit } }),
  getTrendingProducts: (limit?: number): Promise<AxiosResponse<ProductsListResponse>> =>
    api.get('/products/trending', { params: { limit } }),
  getBestSellers: (limit?: number): Promise<AxiosResponse<ProductsListResponse>> =>
    api.get('/products/best-sellers', { params: { limit } }),
  getProductsByTag: (
    tag: string,
    limit?: number
  ): Promise<AxiosResponse<ProductsListResponse>> =>
    api.get(`/products/tag/${tag}`, { params: { limit } }),
}

export interface Platform {
  _id: string
  name: string
  slug: string
  description?: string
  createdAt?: string
  updatedAt?: string
}

export interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  level?: number
  createdAt?: string
  updatedAt?: string
}

// Review types
export interface Review {
  _id: string
  user: {
    _id: string
    name: string
    avatar?: string
  }
  product: string
  rating: number
  title: string
  comment: string
  images?: string[]
  variant?: {
    sku: string
    name: string
  }
  isApproved: boolean
  helpful?: {
    yes: number
    no: number
  }
  createdAt: string
  updatedAt: string
}

export interface ReviewsListResponse {
  reviews: Review[]
  total: number
  page: number
  limit: number
  averageRating?: number
}

export interface CreateReviewRequest {
  productId: string
  rating: number
  title?: string
  comment?: string
  images?: string[]
  variantSku?: string
}

export const platformService = {
  getPlatforms: (): Promise<AxiosResponse<{ data: Platform[] }>> =>
    api.get('/platforms'),
}

export const categoryService = {
  getCategories: (): Promise<AxiosResponse<{ data: Category[] }>> =>
    api.get('/categories'),
}

export const reviewService = {
  getProductReviews: (productId: string, page: number = 1, limit: number = 10): Promise<AxiosResponse<{ data: ReviewsListResponse }>> => {
    return api.get(`/reviews/product/${productId}`, { params: { page, limit } }).then(res => ({
      ...res,
      data: {
        data: {
          reviews: res.data.data,
          total: res.data.total,
          page,
          limit,
          averageRating: res.data.averageRating,
        }
      }
    }))
  },
  getReviewById: (reviewId: string): Promise<AxiosResponse<{ data: Review }>> =>
    api.get(`/reviews/${reviewId}`),
  createReview: (data: CreateReviewRequest): Promise<AxiosResponse<{ data: Review }>> =>
    api.post('/reviews', data),
  updateReview: (reviewId: string, data: Partial<CreateReviewRequest>): Promise<AxiosResponse<{ data: Review }>> =>
    api.put(`/reviews/${reviewId}`, data),
  deleteReview: (reviewId: string): Promise<AxiosResponse> =>
    api.delete(`/reviews/${reviewId}`),
  markHelpful: (reviewId: string, helpful: boolean): Promise<AxiosResponse> =>
    api.post(`/reviews/${reviewId}/helpful`, { helpful }),
  // Admin endpoints
  getAdminReviews: (page: number = 1, limit: number = 10, approved?: 'all' | 'true' | 'false', search?: string): Promise<AxiosResponse<any>> =>
    api.get('/reviews/admin/all', { params: { page, limit, approved, search } }),
  approveReview: (reviewId: string): Promise<AxiosResponse<{ data: Review }>> =>
    api.put(`/reviews/${reviewId}/approve`),
  rejectReview: (reviewId: string, reason?: string): Promise<AxiosResponse<{ data: Review }>> =>
    api.put(`/reviews/${reviewId}/reject`, { reason }),
}

// Order types
export interface OrderItem {
  product: string | { _id: string; [key: string]: any }
  variantSku?: string
  variant?: string
  warranty?: string
  quantity: number
  name: string
  image?: string
  priceAtPurchase: number
  price: number
}

export interface ShippingAddress {
  name: string
  address: string
  city: string
  phone: string
  ward?: string
  district?: string
  email?: string
}

export interface Order {
  _id: string
  user: string
  orderCode: string
  orderItems: OrderItem[]
  totalPrice: number
  discountCode?: string
  discountAmount: number
  shippingFee: number
  finalPrice: number
  paymentMethod: string
  paymentStatus: 'unpaid' | 'paid'
  orderStatus: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled' | 'failed' | 'refunded'
  shippingAddress: ShippingAddress
  trackingNumber?: string
  createdAt: string
  updatedAt: string
}

export const orderService = {
  getMyOrders: (page: number = 1, limit: number = 10): Promise<AxiosResponse<{ data: Order[] }>> =>
    api.get('/orders/my-orders', { params: { page, limit } }),
  getOrderById: (orderId: string): Promise<AxiosResponse<{ data: Order }>> =>
    api.get(`/orders/${orderId}`),
}

// Notification types
export type NotificationType = 
  | 'order_created'
  | 'order_updated' 
  | 'order_completed'
  | 'order_cancelled'
  | 'review_pending'
  | 'review_approved'
  | 'review_rejected'
  | 'promotion'
  | 'contact_message'
  | 'inventory_low'
  | 'new_user'
  | 'admin_message'

export interface NotificationMetadata {
  orderId?: string
  reviewId?: string
  productId?: string
  userId?: string
  contactId?: string
  [key: string]: any
}

export interface Notification {
  _id: string
  user: string
  type: NotificationType
  title: string
  message: string
  icon?: string
  link?: string
  isRead: boolean
  metadata?: NotificationMetadata
  createdAt: string
  updatedAt: string
}

export interface NotificationsListResponse {
  notifications: Notification[]
  total: number
  unreadCount: number
  page: number
  limit: number
}

export const notificationService = {
  // Get user notifications
  getNotifications: (page: number = 1, limit: number = 20): Promise<AxiosResponse<{ data: NotificationsListResponse }>> =>
    api.get('/notifications', { params: { page, limit } }),
  
  // Mark notification as read
  markAsRead: (notificationId: string): Promise<AxiosResponse<{ data: Notification }>> =>
    api.put(`/notifications/${notificationId}/read`, {}),
  
  // Mark all as read
  markAllAsRead: (): Promise<AxiosResponse> =>
    api.put('/notifications/read-all', {}),
  
  // Delete notification
  deleteNotification: (notificationId: string): Promise<AxiosResponse> =>
    api.delete(`/notifications/${notificationId}`),
  
  // Get unread count
  getUnreadCount: (): Promise<AxiosResponse<{ data: { unreadCount: number } }>> =>
    api.get('/notifications/unread-count'),
}
