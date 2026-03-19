import { FC, useState } from 'react'
import { Icon } from '../atomic'

const NewsletterSection: FC = () => {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setSubscribed(true)
    setEmail('')
    setIsLoading(false)

    // Reset success message after 3 seconds
    setTimeout(() => setSubscribed(false), 3000)
  }

  return (
    <section className="py-20 bg-gradient-to-r from-indigo-600/20 via-slate-950 to-cyan-600/20 border-y border-slate-700">
      <div className="px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="max-w-2xl mx-auto text-center">
          {/* Header */}
          <div className="mb-8">
            <Icon name="mail" size="2xl" className="text-cyan-400 mx-auto mb-4" />
            <h2 className="text-4xl font-black text-white mb-4">
              Stay Updated
            </h2>
            <p className="text-slate-400 text-lg">
              Subscribe to our newsletter and get the latest gaming news, exclusive deals, and tips delivered to your inbox every week.
            </p>
          </div>

          {/* Newsletter Form */}
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              type="email"
              placeholder="Enter your email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-grow px-5 py-4 rounded-lg bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
              required
            />
            <button
              type="submit"
              disabled={isLoading || !email}
              className="px-8 py-4 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-bold whitespace-nowrap transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="inline-block w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  Subscribing...
                </>
              ) : (
                <>
                  Subscribe
                  <Icon name="arrow_forward" size="md" />
                </>
              )}
            </button>
          </form>

          {/* Success Message */}
          {subscribed && (
            <div className="flex items-center justify-center gap-2 p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-300 font-semibold">
              <Icon name="check_circle" size="md" />
              <span>Thanks for subscribing! Check your email for confirmation.</span>
            </div>
          )}

          {/* Benefits */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex flex-col items-center gap-2">
              <Icon name="discount" size="lg" className="text-cyan-400" />
              <span className="text-slate-400 font-semibold">Exclusive Deals</span>
              <span className="text-sm text-slate-500">Members-only discounts</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Icon name="new_releases" size="lg" className="text-indigo-400" />
              <span className="text-slate-400 font-semibold">Early Access</span>
              <span className="text-sm text-slate-500">New products first</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Icon name="info" size="lg" className="text-cyan-400" />
              <span className="text-slate-400 font-semibold">Weekly Tips</span>
              <span className="text-sm text-slate-500">Gaming insights</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default NewsletterSection
