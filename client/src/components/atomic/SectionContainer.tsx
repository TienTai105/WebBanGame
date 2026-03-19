import { FC, ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface SectionContainerProps {
  children: ReactNode
  className?: string
  noPadding?: boolean
}

/**
 * Consistent section container for uniform spacing across all homepage sections
 * Full-width sections with responsive horizontal padding
 */
const SectionContainer: FC<SectionContainerProps> = ({ children, className, noPadding = false }) => {
  return (
    <div
      className={cn(
        'w-full',
        !noPadding && 'px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20',
        className
      )}
    >
      {children}
    </div>
  )
}

export default SectionContainer
