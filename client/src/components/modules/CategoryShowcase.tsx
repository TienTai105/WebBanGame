import { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../utils/cn'
import { usePlatforms } from '../../hooks/queries/useProducts'

interface CategoryShowcaseProps {
  className?: string
}

// Mapping platform colors
const platformColors: Record<string, string> = {
  playstation: 'blue',
  ps5: 'blue',
  ps4: 'blue',
  xbox: 'green',
  nintendo: 'red',
  'nintendo-switch': 'red',
  'meta-quest': 'purple',
}

/**
 * Category showcase with featured platforms from API
 * @component
 */
const CategoryShowcase: FC<CategoryShowcaseProps> = ({
  className,
}) => {
  const navigate = useNavigate()
  const { data: platformsData = [] } = usePlatforms()

  return (
    <section className={cn('py-8', className)} style={{
      backgroundImage: `
        radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(34, 211, 238, 0.08) 0%, transparent 50%),
        linear-gradient(135deg, 
          rgba(15, 23, 42, 1) 0%,
          rgba(30, 27, 75, 0.5) 25%,
          rgba(15, 23, 42, 1) 50%,
          rgba(30, 27, 75, 0.5) 75%,
          rgba(15, 23, 42, 1) 100%)
      `,
      backgroundAttachment: 'fixed',
    }}>
      <div className="px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {platformsData.slice(0, 3).map((platform) => {
            const colorKey = platform.slug?.toLowerCase() || ''
            const colorClass = platformColors[colorKey] || 'blue'
            const hoverColorMap: Record<string, string> = {
              blue: 'bg-blue-900/40 group-hover:bg-blue-900/20',
              green: 'bg-green-900/40 group-hover:bg-green-900/20',
              red: 'bg-red-900/40 group-hover:bg-red-900/20',
              purple: 'bg-purple-900/40 group-hover:bg-purple-900/20',
            }
            const platformImage = `/images/category${platformsData.indexOf(platform) + 1}.png`
            
            return (
              <button
                key={platform._id}
                onClick={() => navigate(`/products?platform=${platform._id}`)}
                className="group relative h-80 rounded-2xl overflow-hidden border border-slate-800 hover:border-slate-600 transition-all"
              >
                {/* Background Image */}
                <img
                  src={platformImage}
                  alt={platform.name}
                  className="absolute inset-0 w-full h-full object-cover opacity-70"
                  loading="eager"
                  onError={(e) => (e.currentTarget.src = '/images/placeholder.png')}
                />

                {/* Color Overlay */}
                <div
                  className={cn(
                    'absolute inset-0',
                    hoverColorMap[colorClass] || hoverColorMap['blue'],
                    'transition-colors duration-300'
                  )}
                />

                {/* Text Content */}
                <div className="relative h-full flex items-center justify-center">
                  <span className="text-3xl font-black text-white italic tracking-tighter">
                    {platform.name}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default CategoryShowcase
