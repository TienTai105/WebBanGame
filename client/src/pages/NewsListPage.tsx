import { FC, useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useNewsList, useNewsCategories } from '../hooks/queries/useNews'
import ArticleCard from '../components/small/ArticleCard'
import Pagination from '../components/modules/Pagination'
import SectionContainer from '../components/atomic/SectionContainer'
import SearchBar from '../components/small/SearchBar'
import { Icon } from '../components/atomic'

const NewsListPage: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest')
  
  const sortDetailsRef = useRef<HTMLDetailsElement>(null)
  const categoryDetailsRef = useRef<HTMLDetailsElement>(null)

  // Fetch news and categories
  const newsQuery = useNewsList(page, 12, category || undefined, search || undefined, undefined, sort)
  const categoriesQuery = useNewsCategories()

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (page > 1) params.set('page', page.toString())
    if (search) params.set('search', search)
    if (category) params.set('category', category)
    if (sort !== 'newest') params.set('sort', sort)

    setSearchParams(params, { replace: true })
  }, [page, search, category, sort, setSearchParams])

  const handleSearch = (query: string) => {
    setSearch(query)
    setPage(1)
  }


  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const news = newsQuery.data?.data || []
  const pagination = newsQuery.data?.pagination
  const categories = categoriesQuery.data?.data || []

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

      {/* Hero Section - Premium Design */}
      <section className="relative overflow-hidden py-15 mt-6 w-full max-w-8xl mx-auto">
        {/* Background Elements */}
    

        <SectionContainer>
          {/* Badge */}
          <div className="inline-block mb-4 ">
            <div className="px-4 py-2 rounded-full">
              <span className="text-cyan-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <Icon name="newspaper" size="xs" />
                Latest Updates
              </span>
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4 leading-tight">
            Gaming News &
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 text-transparent bg-clip-text"> Industry Insights</span>
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl leading-relaxed">
            Khám phá các xu hướng chơi game mới nhất, đánh giá, phỏng vấn độc quyền và đổi mới trong ngành công nghiệp. Luôn đi trước với nội dung được chọn lọc của chúng tôi.
          </p>
        </SectionContainer>
      </section>

      {/* Filters Section - Using SearchBar & Built-in Components */}
      <section className=" sticky py-6 top-0 z-40 backdrop-blur-xl max-w-8xl mx-auto">
        <SectionContainer className="py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Input - Using Built-in SearchBar */}
            <div className="lg:col-span-2">
              <SearchBar
                onSearch={handleSearch}
                placeholder="Search articles, reviews, guides..."
                showButton={false}
                size="lg"
              />
            </div>

            {/* Sort Dropdown */}
            <details ref={sortDetailsRef} className="group relative">
              <summary className="flex items-center justify-between px-6 py-4 bg-slate-900/30 border border-indigo-500/30 rounded-lg text-white text-base font-medium cursor-pointer hover:border-indigo-400/50 transition list-none">
                <span className="font-medium">
                  {sort === 'newest' && 'Newest First'}
                  {sort === 'oldest' && 'Oldest First'}
                  {sort === 'mostviewed' && 'Most Viewed'}
                  {sort === 'trending' && 'Trending'}
                </span>
                <Icon name="expand_more" size="md" className="group-open:rotate-180 transition text-indigo-400" />
              </summary>
              <div className="absolute top-full left-0 right-0 mb-2 bg-slate-900 border border-indigo-500/30 rounded-lg shadow-2xl z-50 overflow-hidden">
                <button
                  onClick={() => {
                    setSort('newest')
                    setPage(1)
                    sortDetailsRef.current?.removeAttribute('open')
                  }}
                  className={`w-full text-left px-6 py-4 text-base font-medium transition border-l-2 ${
                    sort === 'newest' ? 'bg-indigo-500/20 text-indigo-400 border-l-indigo-400' : 'text-slate-300 border-l-transparent hover:bg-indigo-700/50'
                  }`}
                >
                  Newest First
                </button>
                <button
                  onClick={() => {
                    setSort('oldest')
                    setPage(1)
                    sortDetailsRef.current?.removeAttribute('open')
                  }}
                  className={`w-full text-left px-6 py-4 text-base font-medium transition border-l-2 ${
                    sort === 'oldest' ? 'bg-indigo-500/20 text-indigo-400 border-l-indigo-400' : 'text-slate-300 border-l-transparent hover:bg-indigo-700/50'
                  }`}
                >
                  Oldest First
                </button>
                <button
                  onClick={() => {
                    setSort('mostviewed')
                    setPage(1)
                    sortDetailsRef.current?.removeAttribute('open')
                  }}
                  className={`w-full text-left px-6 py-4 text-base font-medium transition border-l-2 ${
                    sort === 'mostviewed' ? 'bg-indigo-500/20 text-indigo-400 border-l-indigo-400' : 'text-slate-300 border-l-transparent hover:bg-indigo-700/50'
                  }`}
                >
                  Most Viewed
                </button>
                <button
                  onClick={() => {
                    setSort('trending')
                    setPage(1)
                    sortDetailsRef.current?.removeAttribute('open')
                  }}
                  className={`w-full text-left px-6 py-4 text-base font-medium transition border-l-2 ${
                    sort === 'trending' ? 'bg-indigo-500/20 text-indigo-400 border-l-indigo-400' : 'text-slate-300 border-l-transparent hover:bg-indigo-700/50'
                  }`}
                >
                  Trending
                </button>
              </div>
            </details>

            {/* Categories Dropdown */}
            <details ref={categoryDetailsRef} className="group relative">
              <summary className="flex items-center justify-between px-6 py-4 bg-slate-900/30 border border-indigo-500/30 rounded-lg text-white text-base font-medium cursor-pointer hover:border-indigo-400/50 transition list-none">
                <span className="font-medium">{category ? category : 'All Categories'}</span>
                <Icon name="expand_more" size="md" className="group-open:rotate-180 transition text-indigo-400" />
              </summary>
              <div className="absolute top-full left-0 right-0 mb-2 bg-slate-900 border border-indigo-500/30 rounded-lg shadow-2xl z-50 overflow-hidden">
                <button
                  onClick={() => {
                    setCategory('')
                    setPage(1)
                    categoryDetailsRef.current?.removeAttribute('open')
                  }}
                  className={`w-full text-left px-6 py-4 text-base font-medium transition ${!category ? 'bg-indigo-500/20 text-indigo-400 border-l-2 border-indigo-400' : 'text-slate-300 border-l-2 border-transparent hover:bg-indigo-700/50'}`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setCategory(cat)
                      setPage(1)
                      categoryDetailsRef.current?.removeAttribute('open')
                    }}
                    className={`w-full text-left px-6 py-4 text-base font-medium transition border-l-2 ${
                      category === cat ? 'bg-indigo-500/20 text-indigo-400 border-l-indigo-400' : 'text-slate-300 border-l-transparent hover:bg-indigo-700/50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </details>
          </div>

          {/* Results Info */}
          <div className="mt-4 flex items-center justify-between flex-wrap gap-4">
            <div className="text-sm text-slate-400">
              {newsQuery.isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                  Loading articles...
                </span>
              ) : (
                <span>
                  Showing <span className="text-cyan-400 font-semibold">{news.length}</span> of <span className="text-cyan-400 font-semibold">{pagination?.total || 0}</span> articles
                </span>
              )}
            </div>
            {search && (
              <button
                onClick={() => {
                  setSearch('')
                  setPage(1)
                }}
                className="text-xs text-slate-400 hover:text-cyan-400 transition flex items-center gap-1"
              >
                <Icon name="close" size="xs" />
                Clear search
              </button>
            )}
          </div>
        </SectionContainer>
      </section>

      {/* Content Section */}
      <section className="py-20 w-full max-w-8xl mx-auto">
        <SectionContainer>
          {newsQuery.isLoading ? (
            <div className="flex justify-center items-center py-32">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full animate-spin opacity-20" />
                  <div className="absolute inset-2 bg-slate-950 rounded-full" />
                  <Icon name="article" size="lg" className="absolute inset-0 text-cyan-400 m-auto" />
                </div>
                <p className="text-slate-400 text-lg font-medium">Loading premium content...</p>
              </div>
            </div>
          ) : newsQuery.isError ? (
            <div className="flex justify-center items-center py-32">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                  <Icon name="error_outline" size="lg" className="text-red-400" />
                </div>
                <p className="text-slate-300 font-semibold mb-4">Unable to load articles</p>
                <p className="text-slate-400 mb-6 text-sm">Please check your connection and try again</p>
                <button
                  onClick={() => newsQuery.refetch()}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-lg transition shadow-lg hover:shadow-cyan-500/30"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : news.length === 0 ? (
            <div className="flex justify-center items-center py-32">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <Icon name="article" size="lg" className="text-slate-500" />
                </div>
                <p className="text-slate-400 text-lg font-medium">No articles found</p>
                <p className="text-slate-500 text-sm mt-2">Try adjusting your search or filters</p>
              </div>
            </div>
          ) : (
            <>
              {/* Articles Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                {news.map((article) => (
                  <ArticleCard key={article._id} article={article} />
                ))}
              </div>

              {/* Pagination - Using Built-in Pagination Component */}
              {pagination && pagination.pages > 1 && (
                <div className="pt-12 border-t border-slate-800">
                  <Pagination
                    currentPage={page}
                    totalPages={pagination.pages}
                    onPageChange={handlePageChange}
                    maxVisiblePages={5}
                  />
                </div>
              )}
            </>
          )}
        </SectionContainer>
      </section>
    </div>
    </div>
  )
}

export default NewsListPage
