import { FC } from 'react'
import { cn } from '../../utils/cn'

interface PriceProps {
  originalPrice?: number
  finalPrice: number
  discount?: number
  className?: string
  /**
   * Show original price strikethrough
   */
  showOriginal?: boolean
}

/**
 * Price display component with original and final price
 * @component
 * @example
 * <Price originalPrice={1000000} finalPrice={850000} discount={15} />
 * <Price finalPrice={500000} />
 */
const Price: FC<PriceProps> = ({
  originalPrice,
  finalPrice,
  discount = 0,
  className,
  showOriginal = true,
}) => {
  return (
    <div className={cn('flex items-baseline gap-2', className)}>
      {/* Final Price - PRIMARY */}
      <span className="text-secondary text-lg font-bold">
        {finalPrice.toLocaleString('vi-VN')} VNĐ
      </span>

      {/* Original Price - STRIKETHROUGH */}
      {showOriginal && originalPrice && originalPrice > finalPrice && (
        <span className="text-slate-500 text-xs line-through">
          {originalPrice.toLocaleString('vi-VN')} VNĐ
        </span>
      )}

      {/* Discount Percentage */}
      {discount > 0 && (
        <span className="text-red-500 text-xs font-bold">-{discount}%</span>
      )}
    </div>
  )
}

export default Price
