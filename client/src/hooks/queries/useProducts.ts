import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { productService, ProductResponse, platformService, Platform, categoryService, Category } from '../../services/index'

// Type for products list response
export interface ProductsData {
  products: ProductResponse[]
  total: number
  page: number
  limit: number
}

// Type for product list filters
export interface ProductListFilters {
  page?: number
  limit?: number
  category?: string
  search?: string
  brand?: string | string[]
  platforms?: string | string[]
  minPrice?: number
  maxPrice?: number
  sort?: 'newest' | 'priceAsc' | 'priceDesc' | 'bestSellers' | 'trending'
  hasDiscount?: string
  isNew?: string
  isBestseller?: string
}

// Hook for getting all products with pagination and advanced filters
export const useProducts = (
  page: number = 1,
  limit: number = 12,
  category?: string,
  filters?: ProductListFilters
): UseQueryResult<ProductsData> => {
  return useQuery({
    queryKey: ['products', page, limit, category, filters],
    queryFn: () =>
      productService
        .getProducts({ 
          page, 
          limit, 
          ...(category && { category }),
          ...filters 
        })
        .then((res) => res.data.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook for trending products
export const useTrendingProducts = (
  limit: number = 10
): UseQueryResult<ProductsData> => {
  return useQuery({
    queryKey: ['products', 'trending', limit],
    queryFn: () =>
      productService.getTrendingProducts(limit).then((res) => res.data.data),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook for single product
export const useProduct = (id: string): UseQueryResult<ProductResponse> => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getProductById(id).then((res) => res.data.data),
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
}

// Hook for products by category
export const useProductsByCategory = (
  category: string,
  limit: number = 10
): UseQueryResult<ProductsData> => {
  return useQuery({
    queryKey: ['products', 'category', category, limit],
    queryFn: () =>
      productService
        .getProductsByCategory(category, limit)
        .then((res) => res.data.data),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook for flash sale products (tagged with 'sale')
export const useFlashSaleProducts = (
  limit: number = 10
): UseQueryResult<ProductsData> => {
  return useQuery({
    queryKey: ['products', 'flash-sale', limit],
    queryFn: () =>
      productService
        .getProductsByTag('sale', limit)
        .then((res) => res.data.data),
    staleTime: 5 * 60 * 1000, // 5 minutes (flash sale updates frequently)
  })
}

// Hook for products by tag (generic)
export const useProductsByTag = (
  tag: string,
  limit: number = 10
): UseQueryResult<ProductsData> => {
  return useQuery({
    queryKey: ['products', 'tag', tag, limit],
    queryFn: () =>
      productService
        .getProductsByTag(tag, limit)
        .then((res) => res.data.data),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook for best seller products (sorted by soldCount)
export const useBestSellerProducts = (
  limit: number = 10
): UseQueryResult<ProductsData> => {
  return useQuery({
    queryKey: ['products', 'best-sellers', limit],
    queryFn: () =>
      productService.getBestSellers(limit).then((res) => res.data.data),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook for fetching all platforms
export const usePlatforms = (): UseQueryResult<Platform[]> => {
  return useQuery({
    queryKey: ['platforms'],
    queryFn: () =>
      platformService.getPlatforms().then((res) => res.data.data),
    staleTime: 1 * 60 * 60 * 1000, // 1 hour (platforms don't change frequently)
  })
}

// Hook for fetching all categories
export const useCategories = (): UseQueryResult<Category[]> => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () =>
      categoryService.getCategories().then((res) => res.data.data),
    staleTime: 1 * 60 * 60 * 1000, // 1 hour (categories don't change frequently)
  })
}
