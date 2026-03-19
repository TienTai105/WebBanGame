import { FC, ReactNode } from 'react'
import { Link as RouterLink, LinkProps as RouterLinkProps } from 'react-router-dom'
import { cn } from '../../utils/cn'
import Icon from './Icon'

type LinkVariant = 'default' | 'primary' | 'secondary' | 'nav'

interface LinkProps extends RouterLinkProps {
  variant?: LinkVariant
  children: ReactNode
  icon?: string
  iconPosition?: 'left' | 'right'
  className?: string
}

const variantStyles: Record<LinkVariant, string> = {
  default: 'text-secondary hover:underline transition-colors',
  primary: 'text-primary hover:text-primary/80 font-bold transition-colors',
  secondary:
    'text-white/80 hover:text-secondary transition-colors flex items-center gap-2 group',
  nav: 'text-md font-bold uppercase tracking-widest text-slate-300 hover:text-secondary transition-all h-full flex items-center px-1',
}

/**
 * Styled Link component using React Router
 * @component
 * @example
 * <Link to="/products">Xem sản phẩm</Link>
 * <Link to="/sale" variant="primary" icon="flash_on">Flash Sale</Link>
 * <Link to="/back" icon="arrow_back" iconPosition="left">Quay lại</Link>
 */
const Link: FC<LinkProps> = ({
  variant = 'default',
  to,
  children,
  icon,
  iconPosition = 'right',
  className,
  ...props
}) => {
  return (
    <RouterLink
      to={to}
      className={cn(variantStyles[variant], className)}
      {...props}
    >
      {icon && iconPosition === 'left' && (
        <Icon name={icon} size="sm" className="flex-shrink-0" />
      )}
      {children}
      {icon && iconPosition === 'right' && (
        <Icon
          name={icon}
          size="sm"
          className={cn(
            'flex-shrink-0 transition-transform',
            variant === 'secondary' && 'group-hover:translate-x-1'
          )}
        />
      )}
    </RouterLink>
  )
}

export default Link
