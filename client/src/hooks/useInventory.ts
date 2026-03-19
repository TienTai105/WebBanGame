import { useQuery } from '@tanstack/react-query'
import api from '../services/api'

export interface StockInfo {
  available: number
  reserved: number
  sold: number
  canBuy: boolean
}

/**
 * Hook to check stock for a specific product/variant.
 * Queries the backend inventory API.
 * @param productId - MongoDB _id of the product
 * @param variantSku - Variant SKU (nullable for products without variants)
 * @param quantity - Desired quantity (default 1)
 */
export function useInventory(
  productId?: string,
  variantSku?: string | null,
  quantity = 1
) {
  // Send the literal string 'null' when no sku — inventoryController converts 'null' → null for DB query
  const sku = variantSku != null ? variantSku : 'null'

  return useQuery<StockInfo>({
    queryKey: ['inventory', productId, sku, quantity],
    queryFn: () =>
      api
        .get(`/inventory/check-stock/${productId}/${sku}`, { params: { quantity } })
        .then((r) => r.data.data),
    enabled: !!productId,
    staleTime: 30 * 1000, // 30 seconds
    retry: false,
  })
}
