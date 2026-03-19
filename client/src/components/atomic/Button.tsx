import { FC, ButtonHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'
import Icon from './Icon'

type ButtonVariant = 'primary' | 'secondary' | 'icon'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  /**
   * For icon button: icon name from Material Symbols
   */
  icon?: string
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 font-bold transition-all duration-300',
  secondary:
    'bg-white/5 hover:bg-white/10 text-white backdrop-blur-md border border-white/20 font-bold transition-all duration-300',
  icon: 'rounded-full p-2 text-slate-400 hover:text-primary transition-colors duration-300',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm rounded-lg',
  md: 'px-6 py-3 text-base rounded-lg',
  lg: 'px-10 py-4 text-lg rounded-full',
}

/**
 * Button component with multiple variants
 * @component
 * @example
 * <Button variant="primary">Khám Phá Ngay</Button>
 * <Button variant="secondary" size="sm">Xem Trailer</Button>
 * <Button variant="icon" icon="search" />
 */
const Button: FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  disabled,
  className,
  children,
  ...props
}) => {
  const isIconButton = variant === 'icon'

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center',
        'font-display',
        'outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-dark',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isLoading && 'opacity-70 cursor-not-allowed',
        variantStyles[variant],
        !isIconButton && sizeStyles[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Icon name="hourglass_empty" size="sm" className="animate-spin mr-2" />}
      {icon && <Icon name={icon} size={isIconButton ? 'lg' : 'sm'} />}
      {!isIconButton && children}
    </button>
  )
}

export default Button
