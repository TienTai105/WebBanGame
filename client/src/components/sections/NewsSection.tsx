import { FC } from 'react'
import ArticleCard, { Article } from '../small/ArticleCard'
import { Link, Icon } from '../atomic'

interface NewsSectionProps {
  articles?: Article[]
}

const NewsSection: FC<NewsSectionProps> = ({
  articles = [
    {
      _id: 'n1',
      title: 'PS5 Pro: Everything You Need To Know',
      excerpt: 'The latest PlayStation 5 Pro edition brings enhanced graphics and performance. Here\'s our full review.',
      image: 'https://images.unsplash.com/photo-1606944281657-98a8bdf12ebc?w=600&h=400&fit=crop',
      author: 'Gaming Hub',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'Review',
      readTime: 8,
    },
    {
      _id: 'n2',
      title: 'Top 5 Games To Play In 2026',
      excerpt: 'From indie gems to AAA blockbusters, here are the must-play games coming this year.',
      image: 'https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=600&h=400&fit=crop',
      author: 'Gaming Hub',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'Guide',
      readTime: 6,
    },
    {
      _id: 'n3',
      title: 'Gaming Gear Setup Guide for Beginners',
      excerpt: 'Learn what equipment you need to build the perfect gaming setup without breaking the bank.',
      image: 'https://images.unsplash.com/photo-1587829191301-fdf0f8797933?w=600&h=400&fit=crop',
      author: 'Gaming Hub',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'Tutorial',
      readTime: 10,
    },
    {
      _id: 'n4',
      title: 'E-Sports: The Rise of Professional Gaming',
      excerpt: 'Discover how competitive gaming became a billion-dollar industry and where the best players compete.',
      image: 'https://images.unsplash.com/photo-1538481143081-127f31c42f19?w=600&h=400&fit=crop',
      author: 'Gaming Hub',
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'News',
      readTime: 7,
    },
  ]
}) => {
  return (
    <section className="py-20 bg-slate-950">
      <div className="px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        {/* Header */}
        <div className="flex items-start justify-between mb-12 gap-8">
          <div className="flex-grow">
            <div className="inline-block mb-4">
              <span className="text-cyan-400 text-sm font-bold uppercase tracking-widest">📰 Gaming News</span>
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
            View All News
            <Icon name="arrow_forward" size="md" />
          </Link>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {articles.map((article) => (
            <ArticleCard key={article._id} article={article} />
          ))}
        </div>

        {/* CTA Button (Mobile) */}
        <div className="flex lg:hidden justify-center">
          <Link
            to="/news"
            variant="primary"
            className="inline-flex items-center gap-2 font-bold text-lg"
          >
            View All News
            <Icon name="arrow_forward" size="md" />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default NewsSection
