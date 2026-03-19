import { FC, ReactNode } from 'react'
import { cn } from '../../utils/cn'

type BadgeVariant = 'discount' | 'label' | 'promo' | 'hot'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  discount: 'bg-red-600 text-white text-xs font-bold px-2 py-1 rounded',
  label: 'text-slate-400 text-xs mb-1',
  promo: 'bg-secondary text-bg-dark font-bold text-[10px] px-2 py-1 rounded',
  hot: 'bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full',
}

/**
 * Badge component for labels and tags
 * @component
 * @example
 * <Badge variant="discount">-15%</Badge>
 * <Badge variant="promo">0% TRẢ GÓP</Badge>
 * <Badge variant="hot">HOT RELEASE</Badge>
 */
const Badge: FC<BadgeProps> = ({ variant = 'label', children, className }) => {
  return <div className={cn(variantStyles[variant], className)}>{children}</div>
}

export default Badge
