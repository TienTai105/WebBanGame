import { useQuery, useMutation } from '@tanstack/react-query'
import { IPromotion, ValidateCouponRequest, ValidateCouponResponse } from '../../types/promotion'

/**
 * Hook để fetch tất cả promotions
 */
export const usePromotions = () => {
  return useQuery({
    queryKey: ['promotions'],
    queryFn: async () => {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_URL}/promotions`)
      if (!res.ok) throw new Error('Failed to fetch promotions')
      return (await res.json()) as { success: boolean; data: IPromotion[] }
    },
  })
}

/**
 * Hook để lấy chi tiết một promotion bằng code
 */
export const usePromotionByCode = (code?: string) => {
  return useQuery({
    queryKey: ['promotion', code],
    queryFn: async () => {
      if (!code) return null
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_URL}/promotions/${code}`)
      if (!res.ok) throw new Error('Failed to fetch promotion')
      return (await res.json()) as { success: boolean; data: IPromotion }
    },
    enabled: !!code,
  })
}

/**
 * Hook để validate coupon code
 */
export const useValidatePromotion = () => {
  return useMutation({
    mutationFn: async (payload: ValidateCouponRequest) => {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_URL}/promotions/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = (await res.json()) as ValidateCouponResponse

      if (!res.ok) {
        throw new Error(data.error || 'Failed to validate promotion')
      }

      return data
    },
  })
}

/**
 * Hook để apply promotion (record usage)
 */
export const useApplyPromotion = () => {
  return useMutation({
    mutationFn: async (data: { promotionId: string; userId?: string }) => {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_URL}/promotions/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Failed to apply promotion')
      return res.json()
    },
  })
}
