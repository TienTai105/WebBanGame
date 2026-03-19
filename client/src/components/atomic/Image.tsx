import { FC, ImgHTMLAttributes, useState } from 'react'
import { cn } from '../../utils/cn'

interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  /**
   * Enable hover scale effect
   */
  isHoverable?: boolean
  /**
   * Custom aspect ratio class (e.g., "aspect-square", "aspect-video")
   */
  aspectRatio?: string
  /**
   * Image container additional classes
   */
  containerClassName?: string
}

/**
 * Image component with lazy loading and hover effects
 * @component
 * @example
 * <Image src="product.jpg" alt="Product" isHoverable />
 * <Image src="hero.jpg" alt="Hero" aspectRatio="aspect-video" />
 */
const Image: FC<ImageProps> = ({
  isHoverable = false,
  aspectRatio,
  className,
  containerClassName,
  onError,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setHasError(true)
    setIsLoading(false)
    onError?.(e as any)
  }

  const handleLoad = () => {
    setIsLoading(false)
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg',
        aspectRatio,
        isHoverable && 'group',
        containerClassName
      )}
    >
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 animate-pulse" />
      )}

      {/* Fallback for error */}
      {hasError && (
        <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
          <span className="text-slate-400 text-center">Image not found</span>
        </div>
      )}

      {!hasError && (
        <img
          loading="lazy"
          className={cn(
            'w-full h-full object-cover',
            isHoverable && 'group-hover:scale-110 transition-transform duration-500',
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
    </div>
  )
}

export default Image
