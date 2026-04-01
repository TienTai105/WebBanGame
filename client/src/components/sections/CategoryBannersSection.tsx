import { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../atomic'
import { usePlatforms } from '../../hooks/queries/useProducts'
import { useCategories } from '../../hooks/queries/useProducts'

const CategoryBannersSection: FC = () => {
  const navigate = useNavigate()
  const { data: platformsData = [] } = usePlatforms()
  const { data: categoriesData = [] } = useCategories()
  // Mapping platform colors
  const platformColors: Record<string, string> = {
    playstation: 'from-blue-600 to-blue-900',
    ps5: 'from-blue-600 to-blue-900',
    ps4: 'from-blue-600 to-blue-900',
    xbox: 'from-green-600 to-green-900',
    nintendo: 'from-red-600 to-red-900',
    'nintendo-switch': 'from-red-600 to-red-900',
    'meta-quest': 'from-purple-600 to-purple-900',
  }

  return (
    <section className="py-20" style={{
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
        {/* Header */}
        <div className="mb-12">
          <h2 className="text-4xl font-black text-white mb-4">
            Explore by Platform
          </h2>
          <p className="text-slate-400">
            Discover games and accessories for your favorite gaming platform
          </p>
        </div>

        {/* Banner Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {platformsData.slice(0, 3).map((platform, index) => {
            const colorKey = platform.slug?.toLowerCase() || ''
            const color = platformColors[colorKey] || 'from-slate-600 to-slate-900'
            const bannerImage = `/images/banner${index + 5}.png`
            
            // Find Game category
            const gameCategory = categoriesData.find((cat) => 
              cat.name?.toLowerCase().includes('game')
            )
            
            return (
              <button
                key={platform._id}
                onClick={() => {
                  const params = new URLSearchParams()
                  params.append('platform', platform._id)
                  if (gameCategory) {
                    params.append('category', gameCategory._id)
                  }
                  navigate(`/products?${params.toString()}`)
                }}
                className="group relative h-64 rounded-xl overflow-hidden cursor-pointer"
              >
                {/* Background Image */}
                <img
                  src={bannerImage}
                  alt={platform.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                  onError={(e) => (e.currentTarget.src = '/images/placeholder.png')}
                />

                {/* Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-r ${color} opacity-60 group-hover:opacity-40 transition duration-300`} />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <div className="transform group-hover:translate-y-0 transition duration-300">
                    <p className="text-sm font-semibold text-white/80 mb-2 uppercase tracking-widest">
                      Exclusive Games
                    </p>
                    <h3 className="text-2xl font-black text-white mb-4">{platform.name}</h3>
                    <div className="flex items-center gap-2 text-white font-bold group-hover:gap-3 transition">
                      Explore <Icon name="arrow_forward" size="md" />
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default CategoryBannersSection
