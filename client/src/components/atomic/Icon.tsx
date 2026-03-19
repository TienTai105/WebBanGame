import { FC } from 'react'
import { cn } from '../../utils/cn'

type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

interface IconProps {
  /**
   * Material Symbols Outlined icon name
   * @example "search", "shopping_cart", "person"
   */
  name: string
  size?: IconSize
  className?: string
  /**
   * Should fill the icon
   */
  fill?: boolean
}

const sizeMap: Record<IconSize, string> = {
  xs: 'text-xs w-4 h-4',        // 16px
  sm: 'text-sm w-5 h-5',        // 20px
  md: 'text-base w-6 h-6',      // 24px
  lg: 'text-lg w-7 h-7',        // 28px
  xl: 'text-2xl w-8 h-8',       // 32px
  '2xl': 'text-3xl w-10 h-10',  // 40px
}

/**
 * Icon component using Material Symbols Outlined
 * @component
 * @example
 * <Icon name="search" size="lg" />
 * <Icon name="shopping_cart" fill />
 */
const Icon: FC<IconProps> = ({ name, size = 'md', className, fill = false }) => {
  return (
    <span
      className={cn(
        'material-symbols-outlined',
        'inline-flex items-center justify-center select-none',
        sizeMap[size],
        fill && '[font-variation-settings:"FILL"_1]',
        className
      )}
    >
      {name}
    </span>
  )
}

export default Icon
