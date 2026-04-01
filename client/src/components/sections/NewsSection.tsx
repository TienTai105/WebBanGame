import { FC } from 'react'
import { useFeaturedNews } from '../../hooks/queries/useNews'
import ArticleCard, { Article } from '../small/ArticleCard'
import { Link, Icon } from '../atomic'

interface NewsSectionProps {
  articles?: Article[]
}

const NewsSection: FC<NewsSectionProps> = ({ articles: defaultArticles }) => {
  // Use featured news from API if available
  const { data: featuredData, isLoading, isError } = useFeaturedNews()
  const articles = featuredData?.data || defaultArticles || []

  return (
    <section className="py-20 " style={{
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
        <div className="flex items-start justify-between mb-12 gap-8">
          <div className="flex-grow">
            <div className="inline-block mb-4">
              <span className="text-cyan-400 text-sm font-bold uppercase tracking-widest">Gaming News</span>
            </div>
            <h2 className="text-4xl font-black text-white mb-4">
              Latest Gaming News & Articles
            </h2>
            <p className="text-slate-400 max-w-2xl">
              Stay updated with the latest gaming trends, reviews, and industry insights
            </p>
          </div>
          <Link
            to="/news"
            variant="primary"
            className="hidden lg:flex items-center gap-2 font-bold text-lg whitespace-nowrap"
          >
            Xem tất cả <Icon name="arrow_forward" size="md" />
          </Link>
        </div>

        {/* Articles Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-400">Loading articles...</p>
          </div>
        ) : isError ? (
          <div className="text-center py-12">
            <p className="text-slate-400">Unable to load articles</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400">No articles available</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ">
              {articles.map((article) => (
                <ArticleCard key={article._id} article={article} />
              ))}
            </div>
          </>
        )}

        {/* CTA Button (Mobile) */}
        <div className="flex lg:hidden justify-center">
          <Link
            to="/news"
            variant="primary"
            className="inline-flex items-center gap-2 font-bold text-lg"
          >
            Xem tất cả <Icon name="arrow_forward" size="md" />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default NewsSection
