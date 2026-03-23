import { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../atomic'

export interface Article {
  _id: string
  title: string
  excerpt: string
  image?: string
  author: string | { _id: string; name: string; email?: string; avatar?: string }
  date?: string
  category: string
  readTime: number
  slug?: string
  featuredImage?: {
    url: string
    cloudinaryId?: string
    alt?: string
  }
  createdAt?: string
  publishedAt?: string
}

interface ArticleCardProps {
  article: Article
}

const ArticleCard: FC<ArticleCardProps> = ({ article }) => {
  const navigate = useNavigate()
  
  // Handle both old and new format
  const imageUrl = article.image || article.featuredImage?.url || 'https://via.placeholder.com/600x400?text=No+Image'
  const authorName = typeof article.author === 'string' ? article.author : article.author?.name || 'Anonymous'
  const articleDate = article.date || article.publishedAt || article.createdAt || new Date().toISOString()
  const publishDate = new Date(articleDate).toLocaleDateString('vi-VN')
  const articlePath = article.slug ? `/news/${article.slug}` : `/article/${article._id}`

  return (
    <div className="group bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700 hover:border-cyan-500/50 transition duration-300">
      {/* Image Container */}
      <div className="relative overflow-hidden h-82 bg-slate-700">
        <img
          src={imageUrl}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition duration-300" />
        
        {/* Category Badge */}
        <div className="absolute top-4 left-4">
          <span className="bg-cyan-500/80 text-slate-950 text-xs font-bold px-3 py-1 rounded-full">
            {article.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col h-82">
        {/* Title */}
        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-cyan-400 transition">
          {article.title}
        </h3>

        {/* Excerpt */}
        <p className="text-slate-400 text-sm mb-4 flex-grow line-clamp-2">
          {article.excerpt}
        </p>

        {/* Meta Info */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-4 border-t border-slate-700 pt-4">
          <div className="flex items-center gap-2">
            <Icon name="account_circle" size="sm" />
            <span>{authorName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="schedule" size="sm" />
            <span>{publishDate}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <Icon name="schedule" size="xs" />
            <span>{article.readTime} min read</span>
          </div>
          <button
            onClick={() => navigate(articlePath)}
            className="flex items-center gap-2 text-primary hover:text-primary-dark font-semibold text-sm transition"
          >
            Read More
            <Icon name="arrow_forward" size="sm" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ArticleCard
