export interface IPromotion {
  _id?: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  maxDiscount?: number
  minOrderValue?: number
  applicableProducts?: string[]
  applicableCategories?: string[]
  applicablePlatforms?: string[]
  excludeProducts?: string[]
  usageLimit: number
  usedCount: number
  usagePerUser?: number
  usedByUsers?: string[]
  badge?: 'NEW_MEMBER' | 'HOT' | 'FLASH_SALE' | 'PREMIUM' | 'UNLIMITED'
  applicableToNewMembersOnly?: boolean
  startDate: string | Date
  endDate: string | Date
  isActive: boolean
  description?: string
  conditions?: string[]
  createdAt?: string | Date
  updatedAt?: string | Date
}

export interface ValidateCouponRequest {
  code: string
  userId?: string
  orderValue?: number
  cartItems?: Array<{
    productId?: string
    categoryId?: string
    platformId?: string
  }>
}

export interface ValidateCouponResponse {
  success: boolean
  data?: {
    code: string
    type: 'percentage' | 'fixed'
    value: number
    description?: string
    discount: number
    originalValue: number
    finalValue: number
  }
  error?: string
}
