import { FC, ReactNode } from 'react'
import { cn } from '../../utils/cn'

type PromoVariant = 'membership' | 'preorder'

interface PromoCardProps {
  variant: PromoVariant
  title: string
  subtitle: string
  buttonText: string
  buttonAction?: () => void
  image?: string
  children?: ReactNode
  className?: string
}

const variantStyles: Record<PromoVariant, string> = {
  membership: 'bg-gradient-to-br from-indigo-600 to-purple-800 border border-primary/20',
  preorder: 'bg-gradient-to-br from-cyan-600 to-blue-800 border border-secondary/20',
}

const buttonVariantStyles: Record<PromoVariant, string> = {
  membership: 'bg-white text-indigo-800 hover:bg-slate-100 shadow-md hover:shadow-lg',
  preorder: 'bg-white text-cyan-700 hover:bg-slate-100 shadow-md hover:shadow-lg',
}

/**
 * Promotional card component for special offers
 * @component
 * @example
 * <PromoCard
 *   variant="membership"
 *   title="Gói Hội Viên Plus"
 *   subtitle="Giảm 50% khi đăng ký 12 tháng"
 *   buttonText="Nhận Ngay"
 *   image={controllerImage}
 * />
 */
const PromoCard: FC<PromoCardProps> = ({
  variant,
  title,
  subtitle,
  buttonText,
  buttonAction,
  image,
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        'relative h-64 rounded-2xl overflow-hidden p-8',
        'flex items-center justify-between',
        variantStyles[variant],
        className
      )}
    >
      {/* Content - Left Side */}
      <div className="flex-1 z-10">
        <h3 className="text-3xl font-bold text-white mb-2">{title}</h3>
        <p
          className={cn(
            'mb-6 font-medium',
            variant === 'membership' ? 'text-indigo-100' : 'text-cyan-100'
          )}
        >
          {subtitle}
        </p>
        <button
          onClick={buttonAction}
          className={cn(
            'px-6 py-3 rounded-lg font-bold transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white',
            buttonVariantStyles[variant]
          )}
        >
          {buttonText}
        </button>
      </div>

      {/* Image - Right Side */}
      {image && (
        <div className="absolute right-8 bottom-0 w-40 h-auto">
          <img
            src={image}
            alt={title}
            className={cn(
              'w-full h-full object-contain',
              'transform',
              variant === 'membership' ? 'rotate-12' : '-rotate-12'
            )}
          />
        </div>
      )}

      {children}
    </div>
  )
}

export default PromoCard
