import { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../utils/cn'

interface Category {
  name: string
  slug: string
  image: string
  color: string // bg-{color}-900
  hoverColor: string // bg-{color}-900/20
}

interface CategoryShowcaseProps {
  categories?: Category[]
  className?: string
}

const defaultCategories: Category[] = [
  {
    name: 'PLAYSTATION',
    slug: 'playstation',
    image:
      '/images/category1.png',
    color: 'blue',
    hoverColor: 'blue',
  },
  {
    name: 'XBOX SERIES',
    slug: 'xbox',
    image:
      '/images/category2.png',
    color: 'green',
    hoverColor: 'green',
  },
  {
    name: 'NINTENDO',
    slug: 'nintendo',
    image:
      '/images/category3.png',
    color: 'red',
    hoverColor: 'red',
  },
]

/**
 * Category showcase with 3 featured categories
 * @component
 */
const CategoryShowcase: FC<CategoryShowcaseProps> = ({
  categories = defaultCategories,
  className,
}) => {
  const navigate = useNavigate()

  return (
    <section className={cn('py-8', className)}>
      <div className="px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => navigate(`/category/${cat.slug}`)}
              className="group relative h-80 rounded-2xl overflow-hidden border border-slate-800 hover:border-slate-600 transition-all"
            >
              {/* Background Image */}
              <img
                src={cat.image}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover opacity-70"
                loading="eager"
              />

              {/* Color Overlay */}
              <div
                className={cn(
                  'absolute inset-0',
                  cat.hoverColor === 'blue' && 'bg-blue-900/40 group-hover:bg-blue-900/20',
                  cat.hoverColor === 'green' && 'bg-green-900/40 group-hover:bg-green-900/20',
                  cat.hoverColor === 'red' && 'bg-red-900/40 group-hover:bg-red-900/20',
                  'transition-colors duration-300'
                )}
              />

              {/* Text Content */}
              <div className="relative h-full flex items-center justify-center">
                <span className="text-3xl font-black text-white italic tracking-tighter">
                  {cat.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CategoryShowcase
