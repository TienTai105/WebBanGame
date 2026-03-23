import { FC, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useNewsDetail, useFeaturedNews } from '../hooks/queries/useNews'
import { useComments, useCreateComment } from '../hooks/queries/useComments'
import { useAuthStore } from '../stores/authStore'
import ArticleCard from '../components/small/ArticleCard'
import SectionContainer from '../components/atomic/SectionContainer'
import { Icon, Button } from '../components/atomic'
import { BlocksRenderer } from '../components/modules/BlockRenderer'

const NewsDetailPage: FC = () => {
  const { slug = '' } = useParams()
  const newsQuery = useNewsDetail(slug)
  const featuredNewsQuery = useFeaturedNews()
  const { user, isAuthenticated } = useAuthStore()
  
  // Get news ID from the fetched news data
  const newsId = newsQuery.data?.data?.news?._id
  
  // Fetch comments
  const commentsQuery = useComments(newsId)
  const comments = commentsQuery.data?.data || []
  
  // Create comment mutation
  const createCommentMutation = useCreateComment()
  
  // Form state
  const [formData, setFormData] = useState({ name: '', email: '', content: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState(false)

  if (newsQuery.isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex justify-center items-center">
        <div className="text-center">
          <Icon name="hourglass_empty" size="lg" className="text-slate-500 mb-4 animate-spin" />
          <p className="text-slate-400">Loading article...</p>
        </div>
      </div>
    )
  }

  if (newsQuery.isError || !newsQuery.data?.data) {
    return (
      <div className="min-h-screen bg-slate-950 flex justify-center items-center">
        <div className="text-center">
          <Icon name="error" size="lg" className="text-red-500 mb-4" />
          <p className="text-slate-400">Article not found</p>
          <Link
            to="/news"
            className="mt-4 inline-flex items-center gap-2 px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition"
          >
            <Icon name="arrow_back" size="sm" />
            Back to News
          </Link>
        </div>
      </div>
    )
  }

  const { news, related } = newsQuery.data?.data || { news: null, related: [] }
  const featuredNews = featuredNewsQuery.data?.data || []
  
  // Use featured news as fallback if no related articles
  const displayRelated = (related && Array.isArray(related) && related.length > 0) 
    ? related 
    : featuredNews.filter((n: any) => n._id !== news?._id).slice(0, 3)
  
  const publishDate = new Date(news?.publishedAt || news?.createdAt).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  console.log('News Detail Data:', { news, related, displayRelated, featuredNews })

  // Form validation
  const validateForm = () => {
    // Name is required only if not authenticated
    if (!isAuthenticated && !formData.name.trim()) {
      setFormError('Vui lòng nhập tên')
      return false
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setFormError('Vui lòng nhập email hợp lệ')
      return false
    }
    if (!formData.content.trim()) {
      setFormError('Vui lòng nhập bình luận')
      return false
    }
    if (formData.content.trim().length < 10) {
      setFormError('Bình luận phải có ít nhất 10 ký tự')
      return false
    }
    return true
  }

  // Handle form submit
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(false)

    if (!validateForm()) return
    if (!newsId) {
      setFormError('Không thể xác định bài viết')
      return
    }

    setIsSubmitting(true)

    try {
      await createCommentMutation.mutateAsync({
        newsId,
        name: isAuthenticated && user ? user.name : formData.name,
        email: formData.email,
        content: formData.content,
      })

      setFormData({ name: '', email: '', content: '' })
      setFormSuccess(true)

      // Refetch comments
      commentsQuery.refetch()

      // Hide success message after 3 seconds
      setTimeout(() => setFormSuccess(false), 3000)
    } catch (error: any) {
      setFormError(error?.response?.data?.message || 'Có lỗi khi gửi bình luận. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Format time
  const formatTime = (date: string | Date) => {
    const commentDate = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diff = now.getTime() - commentDate.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Vừa xong'
    if (minutes < 60) return `${minutes} phút trước`
    if (hours < 24) return `${hours} giờ trước`
    if (days < 7) return `${days} ngày trước`
    return commentDate.toLocaleDateString('vi-VN')
  }

  return (
    <div
      className="min-h-screen bg-slate-950 relative overflow-hidden"
      style={{
        backgroundImage: `
          radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.15) 0%, transparent 40%),
          radial-gradient(circle at 80% 70%, rgba(34, 211, 238, 0.1) 0%, transparent 40%),
          radial-gradient(circle at 50% 90%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
          linear-gradient(135deg, 
            rgba(15, 23, 42, 1) 0%,
            rgba(30, 27, 75, 0.4) 25%,
            rgba(15, 23, 42, 1) 50%,
            rgba(30, 27, 75, 0.4) 75%,
            rgba(15, 23, 42, 1) 100%)
        `,
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(0deg, transparent 24%, rgba(99, 102, 241, 0.05) 25%, rgba(99, 102, 241, 0.05) 26%, transparent 27%, transparent 74%, rgba(99, 102, 241, 0.05) 75%, rgba(99, 102, 241, 0.05) 76%, transparent 77%, transparent),
            linear-gradient(90deg, transparent 24%, rgba(99, 102, 241, 0.05) 25%, rgba(99, 102, 241, 0.05) 26%, transparent 27%, transparent 74%, rgba(99, 102, 241, 0.05) 75%, rgba(99, 102, 241, 0.05) 76%, transparent 77%, transparent)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Main Content Page */}
        <article className="lg:pt-0">
          <SectionContainer>
            <div className="max-w-8xl mx-auto">
              {/* 2-Column Layout Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-12 lg:py-16">
                {/* Main Content - 8 columns */}
                <div className="lg:col-span-8">
                  {/* Featured Image */}
                  {news.featuredImage?.url && (
                    <div className="mb-8 rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl hover:border-cyan-500/30 transition group">
                      <div className="relative overflow-hidden aspect-video">
                        <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/20 to-transparent z-10" />
                        <img
                          src={news.featuredImage.url}
                          alt={news.featuredImage.alt || news.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Meta Badge */}
                  <div className="mb-6">
                    <span className="inline-block px-3 py-1 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border border-cyan-500/50 rounded-full text-cyan-300 text-xs font-bold uppercase tracking-widest">
                      <span className="flex items-center gap-2">
                        <Icon name="bookmark" size="xs" />
                        {news.category}
                      </span>
                    </span>
                  </div>

                  {/* Title */}
                  <h1 className="text-4xl md:text-5xl lg:text-5xl font-black text-white mb-6 leading-tight">
                    {news.title}
                  </h1>

                  {/* Author & Meta Info - Grid Layout */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-10 pb-10 border-b border-slate-700/50">
                    {/* Author */}
                    <div className="flex items-center gap-3">
                      {news.author.avatar && (
                        <img
                          src={news.author.avatar}
                          alt={news.author.name}
                          className="w-12 h-12 rounded-full object-cover border border-cyan-500/30"
                        />
                      )}
                      <div>
                        <p className="text-white font-bold text-sm">{news.author.name}</p>
                        <p className="text-slate-500 text-xs">Tác giả</p>
                      </div>
                    </div>

                    {/* Publish Date */}
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-800/50 rounded-lg">
                        <Icon name="event" size="sm" className="text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm font-medium">{publishDate}</p>
                        <p className="text-slate-600 text-xs">Ngày đăng</p>
                      </div>
                    </div>

                    {/* Read Time */}
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-800/50 rounded-lg">
                        <Icon name="schedule" size="sm" className="text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm font-medium">{news.readTime} phút</p>
                        <p className="text-slate-600 text-xs">Thời gian đọc</p>
                      </div>
                    </div>
                  </div>

                  {/* Article Content - Render from blocks if available, otherwise use HTML */}
                  {news.blocks && news.blocks.length > 0 ? (
                    <div className="mb-12">
                      <BlocksRenderer blocks={news.blocks as any} />
                    </div>
                  ) : (
                    <div
                      className="prose max-w-none text-base  md:text-2xl text-slate-200 mb-12 leading-8"
                      dangerouslySetInnerHTML={{ __html: news.content }}
                      style={{
                        color: 'rgb(226 232 240)',
                        lineHeight: '3rem',
                        '--tw-prose-body': 'rgb(226 232 240)',
                        '--tw-prose-headings': 'rgb(255 255 255)',
                        '--tw-prose-lead': 'rgb(226 232 240)',
                        '--tw-prose-links': 'rgb(06 182 212)',
                        '--tw-prose-bold': 'rgb(255 255 255)',
                        '--tw-prose-counters': 'rgb(100 116 139)',
                        '--tw-prose-bullets': 'rgb(71 85 105)',
                        '--tw-prose-hr': 'rgb(71 85 105)',
                        '--tw-prose-quote-borders': 'rgb(100 116 139)',
                        '--tw-prose-captions': 'rgb(148 163 184)',
                        '--tw-prose-code': 'rgb(226 232 240)',
                        '--tw-prose-code-bg': 'rgb(30 41 59)',
                        '--tw-prose-pre-code': 'rgb(226 232 240)',
                        '--tw-prose-pre-bg': 'rgb(15 23 42)',
                      } as any}
                    />
                  )}

                 

                  
                  {/* Related Articles */}
                  {displayRelated && displayRelated.length > 0 && (
                    <div className="pt-12 border-t border-slate-700/50">
                      <h2 className="text-2xl md:text-3xl font-black text-white mb-8 flex items-center gap-3">
                        <Icon name="article" size="md" className="text-cyan-400" />
                        Bài viết liên quan
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {displayRelated.slice(0, 2).map((article: any) => (
                          <ArticleCard key={article._id} article={article} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar - 4 columns */}
                <div className="lg:col-span-4">
                  <div className="space-y-6 sticky top-24">
                    {/* Newsletter Signup */}
                    <div className="p-6 bg-slate-800/50 rounded-xl shadow-lg border border-cyan-500/30">
                      <h3 className="text-white font-black text-lg mb-2 flex items-center gap-2">
                        <Icon name="mail" size="sm" />
                        Nhận tin tức
                      </h3>
                      <p className="text-cyan-100 text-sm mb-4">Cập nhật tức thì về content gaming mới</p>
                      <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
                        <input
                          type="email"
                          placeholder="Email của bạn"
                          className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                        />
                        <Button
                          type="submit"
                          variant="primary"
                          size="md"
                          className="w-full "
                        >
                          SUBSCRIBE
                        </Button>
                      </form>
                    </div>

                    {/* Most Read Articles */}
                    <div className="p-6 bg-slate-800/50 border border-slate-700/50 rounded-xl backdrop-blur-sm hover:border-cyan-500/30 transition">
                      <h3 className="text-white font-black text-base mb-6 uppercase tracking-wide">Most Read</h3>
                      {newsQuery.isLoading || featuredNewsQuery.isLoading ? (
                        <div className="space-y-5">
                          {Array.from({ length: 4 }).map((_, idx) => (
                            <div key={idx} className="pb-5 border-b border-slate-700/50 last:border-b-0 last:pb-0 animate-pulse flex gap-4">
                              <div className="w-12 h-8 bg-slate-700 rounded flex-shrink-0" />
                              <div className="flex-1">
                                <div className="h-4 bg-slate-700 rounded w-3/4 mb-2" />
                                <div className="h-3 bg-slate-700 rounded w-1/2" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : displayRelated && displayRelated.length > 0 ? (
                        <div className="space-y-5">
                          {displayRelated.slice(0, 4).map((article: any, idx: number) => (
                            <Link
                              key={article._id}
                              to={`/news/${article.slug}`}
                              className="group flex items-start gap-4 pb-5 border-b border-slate-700/50 last:border-b-0 last:pb-0 hover:opacity-80 transition"
                            >
                              <div className="flex-shrink-0 text-3xl font-black text-slate-600 opacity-40 min-w-12">
                                {String(idx + 1).padStart(2, '0')}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-slate-200 font-bold text-sm leading-tight group-hover:text-cyan-400 transition line-clamp-2">
                                  {article.title}
                                </p>
                                <p className="text-slate-500 text-xs mt-2 uppercase tracking-widest font-medium">{article.category}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500 text-sm italic">Không có bài viết liên quan</p>
                      )}
                    </div>

                    {/* Partner Spotlight */}
                    <div className="p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-slate-700/50 rounded-xl backdrop-blur-sm hover:border-cyan-500/30 transition overflow-hidden">
                      <div className="flex items-center gap-2 mb-4">
                        <Icon name="star" size="sm" className="text-cyan-400" />
                        <h3 className="text-white font-black text-sm uppercase">Nổi bật</h3>
                      </div>
                      <div className="relative rounded-lg overflow-hidden mb-4 aspect-square bg-slate-700/50 group/featured">
                        <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                          <div className="text-center">
                            <Icon name="games" size="lg" className="text-cyan-400/60 mx-auto mb-2" />
                            <p className="text-slate-400 text-xs font-medium">Featured</p>
                          </div>
                        </div>
                      </div>
                      <h4 className="text-white font-bold text-sm mb-2 line-clamp-2">
                        Khám phá gaming mới
                      </h4>
                      <p className="text-slate-400 text-xs mb-4 line-clamp-2">
                        Cập nhật các bản phát hành sắp tới
                      </p>
                      <Button
                        variant="primary"
                        size="md"
                        className="w-full"
                      >
                        Xem chi tiết
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <div className="py-12 border-t border-slate-700/50">
                <h2 className="text-2xl md:text-3xl font-black text-white mb-8 flex items-center gap-3">
                  <Icon name="comment" size="md" className="text-cyan-400" />
                  Bình luận ({comments.length})
                </h2>

                {/* Comment Form */}
                <div className="mb-12 p-6 bg-slate-800/50 border border-slate-700/50 rounded-xl backdrop-blur-sm">
                  <h3 className="text-white font-bold text-lg mb-6">Để lại bình luận của bạn</h3>

                  {/* Success Message */}
                  {formSuccess && (
                    <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-3">
                      <Icon name="check_circle" size="sm" className="text-green-400" />
                      <p className="text-green-300 text-sm font-medium">Bình luận của bạn đã được gửi thành công!</p>
                    </div>
                  )}

                  {/* Error Message */}
                  {formError && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3">
                      <Icon name="error" size="sm" className="text-red-400" />
                      <p className="text-red-300 text-sm font-medium">{formError}</p>
                    </div>
                  )}

                  <form className="space-y-4" onSubmit={handleSubmitComment}>
                    {/* Show logged in user info */}
                    {isAuthenticated && user && (
                      <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg mb-4">
                        <p className="text-cyan-300 text-sm">
                          <span className="font-medium">Bình luận với tài khoản:</span> {user.name} ({user.email})
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Name Input - Only show if not authenticated */}
                      {!isAuthenticated && (
                        <div>
                          <label className="block text-slate-300 text-sm font-medium mb-2">Tên của bạn *</label>
                          <input
                            type="text"
                            placeholder="Nhập tên..."
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                            disabled={isSubmitting}
                          />
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-slate-300 text-sm font-medium mb-2">Email của bạn *</label>
                        <input
                          type="email"
                          placeholder="your@email.com"
                          value={isAuthenticated && user ? user.email : formData.email}
                          onChange={(e) => !isAuthenticated && setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                          disabled={isSubmitting || isAuthenticated}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Bình luận của bạn *</label>
                      <textarea
                        placeholder="Chia sẻ suy nghĩ của bạn..."
                        rows={5}
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm resize-none"
                        disabled={isSubmitting}
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isSubmitting || createCommentMutation.isPending}
                      size="md"
                      isLoading={isSubmitting || createCommentMutation.isPending}
                      loadingText="Đang gửi..."
                      icon={!isSubmitting && !createCommentMutation.isPending ? 'send' : undefined}
                    >
                      Gửi bình luận
                    </Button>
                  </form>
                </div>

                {/* Comments List */}
                {commentsQuery.isLoading ? (
                  <div className="space-y-6 mt-8">
                    <h3 className="text-white font-bold text-lg">Bình luận gần đây</h3>
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div key={idx} className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/50 animate-pulse">
                        <div className="flex gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-700" />
                          <div className="flex-1">
                            <div className="h-4 bg-slate-700 rounded w-24 mb-2" />
                            <div className="space-y-2">
                              <div className="h-3 bg-slate-700 rounded w-full" />
                              <div className="h-3 bg-slate-700 rounded w-3/4" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : comments && comments.length > 0 ? (
                  <div className="space-y-6 mt-8">
                    <h3 className="text-white font-bold text-lg">Bình luận gần đây</h3>
                    {comments.map((comment: any) => (
                      <div key={comment._id || comment.id} className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/50 hover:border-slate-600/50 transition">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-sm">{getInitials(comment.name)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="text-white font-bold text-sm">{comment.name}</p>
                              <span className="text-slate-500 text-xs">{formatTime(comment.createdAt)}</span>
                            </div>
                            <p className="text-slate-300 text-sm leading-relaxed break-words">{comment.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 mt-8">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-800/50 border border-slate-700/50 flex items-center justify-center">
                      <Icon name="comment" size="md" className="text-slate-600" />
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Chưa có bình luận nào</p>
                    <p className="text-slate-500 text-xs mt-2">Hãy là người bình luận đầu tiên!</p>
                  </div>
                )}
              </div>

              {/* Back Button */}
              <div className="py-12 border-t border-slate-700/50">
                <Link
                  to="/news"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-semibold transition group"
                >
                  <Icon name="arrow_back" size="sm" className="group-hover:-translate-x-1 transition" />
                  Quay lại danh sách
                </Link>
              </div>
            </div>
          </SectionContainer>
        </article>
      </div>
    </div>
  )
}

export default NewsDetailPage
