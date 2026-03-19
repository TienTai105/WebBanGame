import { FC } from 'react'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { cn } from '../../utils/cn'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[]
  className?: string
  autoGenerate?: boolean // Auto-generate from route
}

/**
 * Breadcrumb navigation component
 * Shows hierarchical navigation path (e.g., Home > Category > Subcategory)
 * Can auto-generate from current route or accept custom items
 * Last item is not clickable
 * @component
 * @example
 * <Breadcrumb autoGenerate /> // Auto from route
 * // or
 * <Breadcrumb
 *   items={[
 *     { label: 'Trang chủ', href: '/' },
 *     { label: 'Thiết bị & Game' }
 *   ]}
 * />
 */
const Breadcrumb: FC<BreadcrumbProps> = ({ items, className, autoGenerate = true }) => {
  const location = useLocation()

  // Generate breadcrumb items from current route
  const generateBreadcrumbsFromRoute = (): BreadcrumbItem[] => {
    const pathnames = location.pathname.split('/').filter((x) => x)

    const breadcrumbs: BreadcrumbItem[] = [{ label: 'Trang chủ', href: '/' }]

    if (pathnames.length === 0) {
      return breadcrumbs
    }

    pathnames.forEach((pathname, index) => {
      const href = `/${pathnames.slice(0, index + 1).join('/')}`
      const label = getPageLabel(pathname)

      breadcrumbs.push({ label, href: index < pathnames.length - 1 ? href : undefined })
    })

    return breadcrumbs
  }

  // Map route paths to Vietnamese labels
  const getPageLabel = (path: string): string => {
    const labels: Record<string, string> = {
      products: 'Sản phẩm',
      product: 'Chi tiết sản phẩm',
      cart: 'Giỏ hàng',
      checkout: 'Thanh toán',
      account: 'Tài khoản',
      orders: 'Đơn hàng',
    }
    return labels[path] || path.charAt(0).toUpperCase() + path.slice(1)
  }

  const displayItems = autoGenerate ? generateBreadcrumbsFromRoute() : items || []

  return (
    <nav
      className={cn(
        'flex items-center gap-3 text-2xl mb-12',
        'text-slate-500 dark:text-slate-400',
        className
      )}
    >
      {displayItems.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {/* Item Link or Text */}
          {item.href ? (
            <RouterLink
              to={item.href}
              className="hover:text-primary transition-colors font-medium"
            >
              {item.label}
            </RouterLink>
          ) : (
            <span className="text-indigo-900 dark:text-slate-100 font-bold text-2xl">
              {item.label}
            </span>
          )}

          {/* Divider - except for last item */}
          {index < displayItems.length - 1 && (
            <span className="material-symbols-outlined text-lg">
              chevron_right
            </span>
          )}
        </div>
      ))}
    </nav>
  )
}

export default Breadcrumb
