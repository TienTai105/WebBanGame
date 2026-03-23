import { FC, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SectionContainer from '../components/atomic/SectionContainer'
import { Icon } from '../components/atomic'
import { BlockEditor } from '../components/modules/BlockEditor'

interface Block {
  id?: string
  type: 'heading' | 'paragraph' | 'image' | 'image_grid' | 'list' | 'quote' | 'divider' | 'video' | 'code'
  level?: number
  text?: string
  items?: string[]
  url?: string
  alt?: string
  language?: string
  code?: string
  caption?: string
  columns?: number
  images?: Array<{
    url: string
    alt?: string
    caption?: string
  }>
}

const NewsCreatePage: FC = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    category: 'News',
    tags: '',
    featured: false,
    status: 'draft',
  })
  const [blocks, setBlocks] = useState<Block[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validate
      if (!formData.title.trim() || !formData.excerpt.trim()) {
        setError('Title and excerpt are required')
        setIsSubmitting(false)
        return
      }

      if (blocks.length === 0) {
        setError('Please add at least one block to your article')
        setIsSubmitting(false)
        return
      }

      // TODO: Send to API
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map((t: string) => t.trim()),
        blocks,
      }

      console.log('Article to create:', payload)

      // Simulated API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Navigate to articles list
      // navigate('/news')
    } catch (err: any) {
      setError(err.message || 'Error creating article')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 pt-24">
      <SectionContainer>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition mb-4"
            >
              <Icon name="arrow_back" size="sm" />
              Back
            </button>
            <h1 className="text-4xl font-black text-white mb-2">Create New Article</h1>
            <p className="text-slate-400">Use blocks to build your article content</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3">
              <Icon name="error" size="sm" className="text-red-400" />
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info */}
            <div className="bg-slate-800/40 rounded-xl p-6 border border-slate-700/50 space-y-4">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Icon name="info" size="sm" className="text-cyan-400" />
                Basic Information
              </h2>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 text-white rounded-lg text-sm"
                  placeholder="Article title..."
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Excerpt *</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => handleInputChange('excerpt', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 text-white rounded-lg text-sm resize-none"
                  placeholder="Brief summary..."
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-slate-500 mt-1">{formData.excerpt.length}/500</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 text-white rounded-lg text-sm"
                  >
                    {['News', 'Review', 'Guide', 'Tutorial', 'Interview', 'Opinion', 'Video'].map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 text-white rounded-lg text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 text-white rounded-lg text-sm"
                  placeholder="tag1, tag2, tag3..."
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => handleInputChange('featured', e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="featured" className="text-slate-300 text-sm cursor-pointer">
                  Featured (show on homepage)
                </label>
              </div>
            </div>

            {/* Content Blocks */}
            <div className="bg-slate-800/40 rounded-xl p-6 border border-slate-700/50">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Icon name="layers" size="sm" className="text-cyan-400" />
                Article Content ({blocks.length} blocks)
              </h2>
              <BlockEditor blocks={blocks} onChange={setBlocks} />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg transition font-bold uppercase flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-white rounded-full animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Icon name="publish" size="sm" />
                    Publish Article
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </SectionContainer>
    </div>
  )
}

export default NewsCreatePage
