import { FC } from 'react'
import { cn } from '../../utils/cn'
import Link from '../atomic/Link'

interface NavigationProps {
  activeLink?: string
  className?: string
}

interface NavItem {
  label: string
  href: string
  slug: string
}

const navItems: NavItem[] = [
  { label: 'Trang Chủ', href: '/', slug: 'home' },
  { label: 'Sản Phẩm', href: '/products', slug: 'products' },
  { label: 'Phụ Kiện', href: '/category/phu-kien', slug: 'accessories' },
  { label: 'Tin Tức', href: '/news', slug: 'news' },
  { label: 'Khuyến Mãi', href: '/promotions', slug: 'promotions' },
  { label: 'Cửa Hàng', href: '/store', slug: 'store' },

]

/**
 * Navigation bar with menu items
 * @component
 */
const Navigation: FC<NavigationProps> = ({ activeLink = 'home', className }) => {
  return (
    <div className={cn(
      'sticky top-[72px] z-[99]',
      'bg-slate-900 border-t border-slate-800 backdrop-blur-sm',
      'shadow-lg',
      className
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20  py-5 flex items-center justify-center">
        <nav className="flex items-center gap-10 h-12">
          {navItems.map((item) => (
            <Link
              key={item.slug}
              to={item.href}
              variant="nav"
              className={cn(
                'border-b-2',
                activeLink === item.slug
                  ? 'text-primary border-b-primary'
                  : 'text-slate-300la border-b-transparent hover:text-primary hover:border-primary transition-colors'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
export default Navigation
