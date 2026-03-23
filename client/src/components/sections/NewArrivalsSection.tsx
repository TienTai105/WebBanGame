import { FC } from 'react'
import ProductCard from '../small/ProductCard'
import { Link, Icon } from '../atomic'
import { useProductsByTag } from '../../hooks/queries/useProducts'

interface NewArrivalsProps {
  limit?: number
}

const NewArrivalsSection: FC<NewArrivalsProps> = ({ limit = 4 }) => {
  const { data, isLoading, isError } = useProductsByTag('New Product', limit)
  return (
    <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-950 border-t border-slate-700">
      <div className="px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between mb-12 gap-8">
          <div className="flex-grow">
            <div className="inline-block mb-4">
              <span className="text-cyan-400 text-sm font-bold uppercase tracking-widest">Fresh Arrivals</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">
              Latest Gaming Gear
            </h2>
            <p className="text-slate-400 max-w-2xl">
              Khám phá những sản phẩm gaming mới nhất vừa cập nhật. Công nghệ tiên tiến, hiệu suất đỉnh cao.
            </p>
          </div>

          {/* Decorative Element */}
          <div className="hidden lg:block">
            <div className="text-7xl font-black text-cyan-500/10 select-none">NEW</div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
            <p className="text-red-400">Không thể tải sản phẩm mới. Vui lòng thử lại sau.</p>
          </div>
        )}

        {/* Products Grid */}
        {!isLoading && !isError && data?.products && data.products.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  variant="new-arrival"
                  onAddToCart={() => console.log('Add to cart')}
                  onQuickview={() => console.log('Quickview')}
                />
              ))}
            </div>

            {/* CTA */}
            <div className="mt-12 flex justify-center">
              <Link
                to="/products?filter=new"
                variant="primary"
                className="text-lg px-8 py-4 font-bold flex items-center gap-2 group"
              >
                Xem tất cả
                <Icon name="arrow_forward" size="md" className="group-hover:translate-x-1 transition" />
              </Link>
            </div>
          </>
        )}

        {/* Empty State */}
        {!isLoading && !isError && (!data?.products || data.products.length === 0) && (
          <div className="text-center py-20">
            <p className="text-slate-400">Không có sản phẩm mới</p>
          </div>
        )}
      </div>
    </section>
  )
}


export default NewArrivalsSection
