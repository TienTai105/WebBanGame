import { useQuery, UseQueryResult } from '@tanstack/react-query'
import api from '../../services/api'

export interface NewsArticle {
  _id: string
  title: string
  slug: string
  content: string
  excerpt: string
  featuredImage?: {
    url: string
    cloudinaryId?: string
    alt?: string
  }
  author: {
    _id: string
    name: string
    email: string
    avatar?: string
  }
  category: string
  tags?: string[]
  featured: boolean
  status: 'draft' | 'published' | 'archived'
  publishedAt?: string
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string[]
  blocks?: Array<{
    id?: string
    type: 'heading' | 'paragraph' | 'image' | 'image_grid' | 'list' | 'quote' | 'divider' | 'video' | 'code'
    level?: number
    text?: string
    items?: string[]
    url?: string
    alt?: string
    language?: string
    code?: string
    caption?: string
    columns?: number
    images?: Array<{
      url: string
      alt?: string
      caption?: string
    }>
  }>
  views: number
  readTime: number
  createdAt: string
  updatedAt: string
}

export interface NewsResponse {
  success: boolean
  data: NewsArticle[]
  pagination?: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export interface NewsDetailResponse {
  success: boolean
  data: {
    news: NewsArticle
    related: NewsArticle[]
  }
}

/**
 * Fetch news list with pagination, filters, and search
 */
export function useNewsList(
  page: number = 1,
  limit: number = 10,
  category?: string,
  search?: string,
  featured?: boolean,
  sort?: string
): UseQueryResult<NewsResponse, Error> {
  return useQuery<NewsResponse, Error>({
    queryKey: ['news', page, limit, category, search, featured, sort],
    queryFn: () =>
      api
        .get('/news', {
          params: {
            page,
            limit,
            ...(category && category !== 'all' && { category }),
            ...(search && { search }),
            ...(featured !== undefined && { featured }),
            ...(sort && { sort }),
          },
        })
        .then((r: any) => r.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })
}

/**
 * Fetch featured news articles (max 6)
 */
export function useFeaturedNews(): UseQueryResult<{ success: boolean; data: NewsArticle[] }, Error> {
  return useQuery({
    queryKey: ['news-featured'],
    queryFn: () =>
      api
        .get('/news/featured')
        .then((r: any) => r.data),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  })
}

/**
 * Fetch news categories
 */
export function useNewsCategories(): UseQueryResult<{ success: boolean; data: string[] }, Error> {
  return useQuery({
    queryKey: ['news-categories'],
    queryFn: () =>
      api
        .get('/news/categories')
        .then((r: any) => r.data),
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: 1,
  })
}

/**
 * Fetch news tags
 */
export function useNewsTags(): UseQueryResult<{ success: boolean; data: string[] }, Error> {
  return useQuery({
    queryKey: ['news-tags'],
    queryFn: () =>
      api
        .get('/news/tags')
        .then((r: any) => r.data),
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: 1,
  })
}

/**
 * Fetch single news article by slug (increments views)
 */
export function useNewsDetail(slug?: string): UseQueryResult<NewsDetailResponse, Error> {
  return useQuery<NewsDetailResponse, Error>({
    queryKey: ['news-detail', slug],
    queryFn: () =>
      api
        .get(`/news/${slug}`)
        .then((r: any) => r.data),
    enabled: !!slug,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  })
}
