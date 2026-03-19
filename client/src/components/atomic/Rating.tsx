import { FC } from 'react'
import { cn } from '../../utils/cn'
import Icon from './Icon'

type RatingSize = 'sm' | 'md' | 'lg'

interface RatingProps {
  /**
   * Rating value (0-5)
   */
  rating: number
  /**
   * Number of ratings
   */
  count?: number
  size?: RatingSize
  className?: string
}

const sizeMap: Record<RatingSize, string> = {
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
}

/**
 * Star rating display component
 * @component
 * @example
 * <Rating rating={4.5} count={48} />
 * <Rating rating={4.8} count={2540} size="lg" />
 */
const Rating: FC<RatingProps> = ({ rating, count, size = 'md', className }) => {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 !== 0

  return (
    <div className={cn('flex items-center gap-1', sizeMap[size], className)}>
      <div className="flex gap-0.5">
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Icon
            key={`full-${i}`}
            name="star"
            size={size === 'sm' ? 'xs' : 'sm'}
            fill
            className="text-yellow-400"
          />
        ))}

        {/* Half star */}
        {hasHalfStar && (
          <div className="relative w-4 h-4">
            <Icon
              name="star"
              size={size === 'sm' ? 'xs' : 'sm'}
              className="text-slate-400 absolute"
            />
            <div className="overflow-hidden w-2 h-4">
              <Icon
                name="star"
                size={size === 'sm' ? 'xs' : 'sm'}
                fill
                className="text-yellow-400"
              />
            </div>
          </div>
        )}

        {/* Empty stars */}
        {Array.from({ length: 5 - fullStars - (hasHalfStar ? 1 : 0) }).map((_, i) => (
          <Icon
            key={`empty-${i}`}
            name="star"
            size={size === 'sm' ? 'xs' : 'sm'}
            className="text-slate-400"
          />
        ))}
      </div>

      {/* Rating count */}
      {count !== undefined && <span className="text-slate-400">({count})</span>}
    </div>
  )
}

export default Rating
