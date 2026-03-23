import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import PromotionCard from '../components/modules/PromotionCard'
import { IPromotion } from '../types/promotion'
import { successToast, errorToast } from '../utils/toast'
import { Button } from '../components/atomic'

const PromotionPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [subscribeLoading, setSubscribeLoading] = useState(false)

  // Fetch promotions
  const { data: promotionsData, isLoading } = useQuery({
    queryKey: ['promotions'],
    queryFn: async () => {
      const res = await fetch('/api/promotions')
      if (!res.ok) throw new Error('Failed to fetch promotions')
      return res.json()
    },
  })

  const promotions: IPromotion[] = promotionsData?.data || []

  // Separate promotions by badge
  const premiumPromotion = promotions.find(
    (p) => p.badge === 'PREMIUM'
  )

  // Regular promotions (exclude premium)
  const regularPromotions = promotions.filter(
    (p) => p.badge !== 'PREMIUM'
  )

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubscribeLoading(true)
    
    try {
      // TODO: Integrate with email service (Mailchimp, SendGrid, etc.)
      await new Promise(resolve => setTimeout(resolve, 500))
      successToast('Cảm ơn! Vui lòng kiểm tra email của bạn.')
      setEmail('')
    } catch (error) {
      errorToast('Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setSubscribeLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden" style={{
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
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(0deg, transparent 24%, rgba(99, 102, 241, 0.05) 25%, rgba(99, 102, 241, 0.05) 26%, transparent 27%, transparent 74%, rgba(99, 102, 241, 0.05) 75%, rgba(99, 102, 241, 0.05) 76%, transparent 77%, transparent),
          linear-gradient(90deg, transparent 24%, rgba(99, 102, 241, 0.05) 25%, rgba(99, 102, 241, 0.05) 26%, transparent 27%, transparent 74%, rgba(99, 102, 241, 0.05) 75%, rgba(99, 102, 241, 0.05) 76%, transparent 77%, transparent)
        `,
        backgroundSize: '50px 50px',
      }} />

      <main className="relative z-10">
      {/* Hero Section with Gradient */}
      <section className="pt-20 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Editorial Header */}
          <header className="mb-20">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 lg:gap-12">
              <div className="flex-1">
                <span className="inline-block uppercase tracking-widest text-cyan-400 font-bold mb-6 text-xs">
                  Offers & Rewards
                </span>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold font-space-grotesk tracking-tighter text-white leading-tight mb-0">
                  Tổng hợp mã <br />
                  <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                    giảm giá Voltrix
                  </span>
                </h1>
              </div>

              <div className="lg:max-w-xs">
                <p className="text-slate-300 text-lg md:text-xl leading-relaxed border-l-4 border-indigo-500/50 pl-6">
                  Sở hữu những ưu đãi độc quyền dành riêng cho cộng đồng
                  <span className="font-bold text-white"> ElitePixel Gaming</span>.
                </p>
              </div>
            </div>
          </header>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-10 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse h-96 bg-slate-800 rounded-2xl" />
              ))}
            </div>
          )}

          {/* Promotions Grid */}
          {!isLoading && promotions.length > 0 && (
            <>
              {/* Regular Promotions */}
              {regularPromotions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                  {regularPromotions.slice(0, 3).map((promotion) => (
                    <PromotionCard
                      key={promotion._id}
                      promotion={promotion}
                      onCopy={(code) => {
                        successToast(`Đã sao chép mã ${code}`)
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Additional Regular Promotions if more than 3 */}
              {regularPromotions.length > 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                  {regularPromotions.slice(3).map((promotion) => (
                    <PromotionCard
                      key={promotion._id}
                      promotion={promotion}
                      onCopy={(code) => {
                        successToast(`Đã sao chép mã ${code}`)
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Premium Tier Promotion (Asymmetric Layout) */}
              {premiumPromotion && (
                <div className="relative mb-20 overflow-hidden">
                  <div className="relative bg-gradient-to-br from-indigo-600/20 via-slate-900 to-slate-950 rounded-3xl p-8 md:p-12 lg:p-16 text-white overflow-hidden group border border-indigo-500/20">
                    {/* Content */}
                    <div className="relative z-10 max-w-2xl">
                      {/* Badge */}
                      <div className="inline-flex items-center gap-2 bg-indigo-500/10 backdrop-blur-md border border-indigo-500/30 rounded-full px-4 py-2 mb-8">
                        <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">
                          Premium Tier Only
                        </span>
                      </div>

                      {/* Heading */}
                      <h2 className="text-4xl md:text-5xl lg:text-6xl font-space-grotesk font-extrabold tracking-tight mb-6 leading-tight">
                        Mã đặc quyền Elite <br />
                        <span className="bg-gradient-to-r from-indigo-400 to-cyan-300 bg-clip-text text-transparent">
                          dành cho thành viên Gold
                        </span>
                      </h2>

                      {/* Description */}
                      <p className="text-lg md:text-xl text-slate-300 mb-10 leading-relaxed max-w-lg">
                        {premiumPromotion.conditions?.[0] ||
                          'Bạn là khách hàng thân thiết? Nhận ngay voucher giảm giá trực tiếp 500k cho lần nâng cấp máy tiếp theo.'}
                      </p>

                      {/* Code Box */}
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="flex-1 w-full sm:w-auto bg-slate-800/50 border border-indigo-500/30 rounded-xl p-5">
                          <span className="font-mono text-2xl md:text-3xl font-black text-indigo-300">
                            {premiumPromotion.code}
                          </span>
                        </div>
                        <Button
                          onClick={() => {
                            navigator.clipboard.writeText(premiumPromotion.code)
                            successToast(`Đã sao chép mã ${premiumPromotion.code}`)
                          }}
                            variant="primary"
                          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-900/50 hover:shadow-indigo-900/80 text-lg"
                        >
                          Sao chép mã
                        </Button>
                      </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute -right-40 -top-40 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl transition-transform duration-700 group-hover:scale-125" />
                    <div className="absolute -left-40 -bottom-40 w-80 h-80 bg-cyan-600/5 rounded-full blur-3xl transition-transform duration-700 group-hover:scale-125" />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!isLoading && promotions.length === 0 && (
            <div className="text-center py-24">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800 rounded-full mb-4">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Không có khuyến mãi nào
              </h3>
              <p className="text-slate-400">
                Vui lòng quay lại sau để xem các ưu đãi mới nhất
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-10 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div>
              <h3 className="text-4xl md:text-5xl font-space-grotesk font-extrabold text-white mb-6 leading-tight">
                Bạn chưa tìm <br />
                <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                  mã phù hợp?
                </span>
              </h3>
              <p className="text-lg text-slate-300 leading-relaxed">
                Đăng ký nhận tin để không bỏ lỡ bất kỳ chương trình khuyến mãi nào từ
                <span className="font-bold text-white"> ElitePixel Gaming</span>.
              </p>

              {/* Trust indicators */}
              <div className="mt-8 flex gap-6">
                <div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-1">
                    10K+
                  </div>
                  <p className="text-sm text-slate-400">Thành viên đã theo dõi</p>
                </div>
                <div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-1">
                    500M+
                  </div>
                  <p className="text-sm text-slate-400">Tổng giảm giá</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:pl-8">
              <form onSubmit={handleSubscribe} className="space-y-4">
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email của bạn..."
                    disabled={subscribeLoading}
                    required
                    className="w-full px-6 py-4 bg-slate-800 border-2 border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-colors text-white placeholder-slate-500 font-medium disabled:bg-slate-900 disabled:cursor-not-allowed"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={subscribeLoading}
                  isLoading={subscribeLoading}
                  loadingText="Đang gửi..."
                  variant="primary"
                  size="lg"
                    className="w-full hover:bg-indigo-700  shadow-lg shadow-indigo-900/50 hover:shadow-indigo-900/80 transition-all duration-300"
                >
                  Đăng ký ngay
                </Button>

                <p className="text-xs text-slate-500 text-center">
                  Chúng tôi sẽ không bao giờ gửi spam. Hủy đăng ký bất cứ lúc nào.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="text-3xl font-space-grotesk font-bold text-white mb-4">
            Sẵn sàng mua sắm?
          </h3>
          <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
            Khám phá bộ sưu tập game và đồ chơi của chúng tôi với những mã giảm giá tuyệt vời
          </p>
          <Button
            onClick={() => window.location.href = '/products'}
            variant="primary"
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/50 hover:shadow-indigo-600/70"
          >
            Mua hàng ngay
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      </section>
    </main>
    </div>
  )
}


export default PromotionPage
