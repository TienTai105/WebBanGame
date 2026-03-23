import { useQuery, useMutation, UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import api from '../../services/api'

export interface CommentData {
  id?: string
  newsId: string
  name: string
  email: string
  content: string
  createdAt?: Date
  status?: 'pending' | 'approved' | 'rejected'
}

export interface CommentsResponse {
  success: boolean
  data: CommentData[]
  pagination?: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export interface CommentCountResponse {
  success: boolean
  data: { count: number }
}

export interface CreateCommentResponse {
  success: boolean
  message: string
  data: CommentData
}

/**
 * Fetch comments for a specific news article
 */
export function useComments(
  newsId?: string,
  page: number = 1,
  limit: number = 10
): UseQueryResult<CommentsResponse, Error> {
  return useQuery<CommentsResponse, Error>({
    queryKey: ['comments', newsId, page, limit],
    queryFn: () =>
      api
        .get(`/comments/${newsId}`, {
          params: { page, limit, sort: 'newest' },
        })
        .then((r: any) => r.data),
    enabled: !!newsId,
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 1,
  })
}

/**
 * Fetch comment count for a specific news article
 */
export function useCommentCount(newsId?: string): UseQueryResult<CommentCountResponse, Error> {
  return useQuery<CommentCountResponse, Error>({
    queryKey: ['comment-count', newsId],
    queryFn: () =>
      api
        .get(`/comments/${newsId}/count`)
        .then((r: any) => r.data),
    enabled: !!newsId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })
}

/**
 * Create a new comment
 */
export function useCreateComment(): UseMutationResult<
  CreateCommentResponse,
  Error,
  Omit<CommentData, 'id' | 'createdAt' | 'status'>,
  unknown
> {
  return useMutation({
    mutationFn: (commentData) =>
      api
        .post('/comments', commentData)
        .then((r: any) => r.data),
    retry: 1,
  })
}

/**
 * Delete a comment (admin only)
 */
export function useDeleteComment(): UseMutationResult<
  { success: boolean; message: string },
  Error,
  string,
  unknown
> {
  return useMutation({
    mutationFn: (commentId) =>
      api
        .delete(`/admin/comments/${commentId}`)
        .then((r: any) => r.data),
    retry: 1,
  })
}

/**
 * Update comment status (admin only)
 */
export function useUpdateCommentStatus(): UseMutationResult<
  CreateCommentResponse,
  Error,
  { commentId: string; status: 'pending' | 'approved' | 'rejected' },
  unknown
> {
  return useMutation({
    mutationFn: ({ commentId, status }) =>
      api
        .patch(`/admin/comments/${commentId}/status`, { status })
        .then((r: any) => r.data),
    retry: 1,
  })
}

/**
 * Get all comments (admin only)
 */
export function useAllComments(
  page: number = 1,
  limit: number = 20,
  status?: string,
  newsId?: string
): UseQueryResult<CommentsResponse, Error> {
  return useQuery<CommentsResponse, Error>({
    queryKey: ['all-comments', page, limit, status, newsId],
    queryFn: () =>
      api
        .get(`/admin/comments`, {
          params: { page, limit, status, newsId },
        })
        .then((r: any) => r.data),
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 1,
  })
}
