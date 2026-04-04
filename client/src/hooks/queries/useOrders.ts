import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { orderService, Order } from '../../services/index'

// Hook for getting user's orders
export const useUserOrders = (
  page: number = 1,
  limit: number = 20
): UseQueryResult<Order[]> => {
  return useQuery({
    queryKey: ['my-orders', page, limit],
    queryFn: () =>
      orderService
        .getMyOrders(page, limit)
        .then((res) => res.data.data),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Hook to check if user has completed order for a product
export const useHasCompletedOrderForProduct = (productId: string) => {
  const { data: orders, isLoading } = useUserOrders(1, 100)

  const hasCompletedOrder = !isLoading && orders?.some((order) => {
    // Allow reviews for orders that are shipped or completed (user has paid and received/about to receive)
    const reviewableStatuses = ['shipped', 'delivery', 'completed']
    return (
      reviewableStatuses.includes(order.orderStatus) &&
      order.orderItems.some((item) => {
        // Handle both string ID and populated object
        const itemProductId = typeof item.product === 'string' 
          ? item.product 
          : item.product?._id
        return itemProductId === productId
      })
    )
  })

  return {
    hasCompletedOrder: hasCompletedOrder ?? false,
    isLoading,
    orders: orders ?? [],
  }
}

// Hook to get single order
export const useOrder = (orderId: string): UseQueryResult<Order> => {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () =>
      orderService
        .getOrderById(orderId)
        .then((res) => res.data.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!orderId,
  })
}
