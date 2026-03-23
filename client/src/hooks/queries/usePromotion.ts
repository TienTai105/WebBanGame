import { useQuery, useMutation } from '@tanstack/react-query'
import { IPromotion, ValidateCouponRequest, ValidateCouponResponse } from '../../types/promotion'

/**
 * Hook để fetch tất cả promotions
 */
export const usePromotions = () => {
  return useQuery({
    queryKey: ['promotions'],
    queryFn: async () => {
      const res = await fetch('/api/promotions')
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
      const res = await fetch(`/api/promotions/${code}`)
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
      const res = await fetch('/api/promotions/validate', {
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
      const res = await fetch('/api/promotions/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Failed to apply promotion')
      return res.json()
    },
  })
}
