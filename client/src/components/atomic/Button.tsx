import { FC, ButtonHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'
import Icon from './Icon'

type ButtonVariant = 'primary' | 'secondary' | 'icon' | 'gradient'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  /**
   * For icon button: icon name from Material Symbols
   */
  icon?: string
  /**
   * Show loading spinner while showing text
   */
  showLoadingText?: boolean
  /**
   * Text to show while loading
   */
  loadingText?: string
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-primary hover:bg-primary-dark text-white font-bold transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed',
  secondary:
    'bg-white/5 hover:bg-white/10 text-white backdrop-blur-md border border-white/20 font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed',
  gradient:
    'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold transition shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed',
  icon: 'rounded-full p-2 text-slate-400 hover:text-primary transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm rounded-lg',
  md: 'px-6 py-3 text-base rounded-lg',
  lg: 'px-10 py-4 text-lg rounded-full',
}

/**
 * Button component with multiple variants and sizes
 * @component
 * @example
 * <Button variant="primary">Gửi</Button>
 * <Button variant="secondary" size="sm">Hủy</Button>
 * <Button variant="gradient">Subscribe</Button>
 * <Button variant="icon" icon="search" />
 * <Button isLoading loadingText="Đang gửi...">Gửi bình luận</Button>
 */
const Button: FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  showLoadingText = true,
  loadingText = 'Đang xử lý...',
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
        'inline-flex items-center justify-center gap-2',
        'outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-slate-950',
        isLoading && 'opacity-70 cursor-not-allowed',
        variantStyles[variant],
        !isIconButton && sizeStyles[size],
        !isIconButton && 'uppercase',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <div className="w-4 h-4 border-2 border-slate-300 border-t-white rounded-full animate-spin mr-2" />
      )}
      {!isIconButton && (showLoadingText && isLoading ? loadingText : children)}
      {icon && <Icon name={icon} size={isIconButton ? 'lg' : 'sm'} />}
    </button>
  )
}

export default Button
