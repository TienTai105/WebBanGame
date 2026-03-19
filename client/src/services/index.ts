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

export const platformService = {
  getPlatforms: (): Promise<AxiosResponse<{ data: Platform[] }>> =>
    api.get('/platforms'),
}

export const categoryService = {
  getCategories: (): Promise<AxiosResponse<{ data: Category[] }>> =>
    api.get('/categories'),
}
