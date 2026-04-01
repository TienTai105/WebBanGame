import { FC } from 'react'
import ProductCard from '../small/ProductCard'
import { Icon, Link } from '../atomic'
import { useBestSellerProducts } from '../../hooks/queries/useProducts'

interface BestSellersProps {
  limit?: number
}

const BestSellersSection: FC<BestSellersProps> = ({ limit = 8 }) => {
  // Fetch best seller products from API
  const { data, isLoading, error } = useBestSellerProducts(limit)
  const displayProducts = data?.products || []

  return (
    <section className="py-15" style={{
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
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-12">
          <div>
            <div className="inline-block mb-4">
              <span className="text-indigo-400 text-sm font-bold uppercase tracking-widest">⭐ Top Sellers</span>
            </div>
            <h2 className="text-4xl font-black text-white mb-2">
              Best Sellers This Week
            </h2>
            <p className="text-slate-400">
              Most loved and purchased by gamers worldwide
            </p>
          </div>
          <Link
            to="/products?isBestseller=true"
            variant="primary"
            className="mt-6 lg:mt-0 font-bold text-lg"
          >
          Xem tất cả <Icon name="arrow_forward" size="md" />
          </Link>

        </div>

        {/* Products Grid */}
        {isLoading && (
          <div className="h-64 flex items-center justify-center bg-slate-900/50 rounded-lg border border-slate-800">
            <p className="text-slate-400 text-center">
              <span className="text-4xl mb-3 block animate-spin">⏳</span>
              Đang tải best sellers...
            </p>
          </div>
        )}

        {error && (
          <div className="h-64 flex items-center justify-center bg-slate-900/50 rounded-lg border border-red-800">
            <p className="text-red-400 text-center">
              <span className="text-4xl mb-3 block">⚠️</span>
              Lỗi tải dữ liệu
            </p>
          </div>
        )}

        {!isLoading && !error && displayProducts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                variant="best-seller"
                onAddToCart={() => console.log('Add to cart')}
                onQuickview={() => console.log('Quickview')}
              />
            ))}
          </div>
        )}

        {!isLoading && !error && displayProducts.length === 0 && (
          <div className="h-64 flex items-center justify-center bg-slate-900/50 rounded-lg border border-slate-800">
            <p className="text-slate-400 text-center">
              <span className="text-4xl mb-3 block">🎮</span>
              Không có best sellers
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

export default BestSellersSection
