import { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../atomic'

const CategoryBannersSection: FC = () => {
  const navigate = useNavigate()

  const banners = [
    {
      id: 1,
      title: 'PlayStation Games',
      subtitle: 'Exclusive Titles',
      image: 'https://images.unsplash.com/photo-1606944281657-98a8bdf12ebc?w=800&h=400&fit=crop',
      slug: 'games?platform=ps5',
      color: 'from-blue-600 to-blue-900',
    },
    {
      id: 2,
      title: 'Xbox Game Pass',
      subtitle: '300+ Games',
      image: 'https://images.unsplash.com/photo-1590080876-b1267a9c9fc9?w=800&h=400&fit=crop',
      slug: 'games?platform=xbox',
      color: 'from-green-600 to-green-900',
    },
    {
      id: 3,
      title: 'Nintendo Switch',
      subtitle: 'Portable Gaming',
      image: 'https://images.unsplash.com/photo-1595432707802-6b2626ef1c91?w=800&h=400&fit=crop',
      slug: 'games?platform=switch',
      color: 'from-red-600 to-red-900',
    },
  ]

  return (
    <section className="py-20 bg-slate-950">
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
          {banners.map((banner) => (
            <button
              key={banner.id}
              onClick={() => navigate(`/${banner.slug}`)}
              className="group relative h-64 rounded-xl overflow-hidden cursor-pointer"
            >
              {/* Background Image */}
              <img
                src={banner.image}
                alt={banner.title}
                className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
              />

              {/* Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-r ${banner.color} opacity-60 group-hover:opacity-40 transition duration-300`} />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <div className="transform group-hover:translate-y-0 transition duration-300">
                  <p className="text-sm font-semibold text-white/80 mb-2 uppercase tracking-widest">
                    {banner.subtitle}
                  </p>
                  <h3 className="text-2xl font-black text-white mb-4">{banner.title}</h3>
                  <div className="flex items-center gap-2 text-white font-bold group-hover:gap-3 transition">
                    Explore <Icon name="arrow_forward" size="md" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CategoryBannersSection
