import { FC, useState } from 'react'
import { Icon, Button } from '../atomic'

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
              className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
              required
            />
            <Button
              type="submit"
              disabled={isLoading || !email}
              variant="primary"
              size="md"
              isLoading={isLoading}
              loadingText="Subscribing..."
              className="whitespace-nowrap text-slate-950"
            >
              Đăng ký ngay
            </Button>
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
