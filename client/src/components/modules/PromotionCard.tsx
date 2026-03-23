import React, { useState } from 'react'
import { IPromotion } from '../../types/promotion'
import { Button } from '../atomic'
import ConditionsModal from './ConditionsModal'

interface PromotionCardProps {
  promotion: IPromotion
  onCopy?: (code: string) => void
}

const badgeConfig = {
  NEW_MEMBER: {
    bgColor: 'bg-blue-500/20',
    textColor: 'text-blue-600',
    label: 'New Member',
  },
  HOT: {
    bgColor: 'bg-red-500/20',
    textColor: 'text-red-600',
    label: 'Hot',
  },
  FLASH_SALE: {
    bgColor: 'bg-orange-500/20',
    textColor: 'text-orange-600',
    label: 'Flash Sale',
  },
  PREMIUM: {
    bgColor: 'bg-purple-500/20',
    textColor: 'text-purple-600',
    label: 'Premium Tier',
  },
  UNLIMITED: {
    bgColor: 'bg-emerald-500/20',
    textColor: 'text-emerald-600',
    label: 'Unlimited',
  },
}

const PromotionCard: React.FC<PromotionCardProps> = ({
  promotion,
  onCopy = () => {},
}) => {
  const [copied, setCopied] = useState(false)
  const [showConditionsModal, setShowConditionsModal] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(promotion.code)
    setCopied(true)
    onCopy(promotion.code)
    setTimeout(() => setCopied(false), 2000)
  }

  const badgeConfig_current = promotion.badge
    ? badgeConfig[promotion.badge as keyof typeof badgeConfig]
    : null

  // Format discount display
  const discountDisplay =
    promotion.type === 'percentage'
      ? `-${promotion.value}%`
      : `-${(promotion.value / 1000).toFixed(0)}k`

  // Format expiry date
  const expiryDate = new Date(promotion.endDate)
  const today = new Date()
  const daysLeft = Math.ceil(
    (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  let expiryText = ''
  if (daysLeft === 0) {
    expiryText = 'Hôm nay'
  } else if (daysLeft === 1) {
    expiryText = 'Ngày mai'
  } else if (daysLeft > 0 && daysLeft <= 7) {
    expiryText = `${daysLeft} ngày nữa`
  } else {
    expiryText = expiryDate.toLocaleDateString('vi-VN')
  }

  return (
    <div className="group relative bg-slate-800 rounded-2xl p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-600/20 border border-slate-700 hover:border-indigo-500/50">
      {/* Header with discount & badge */}
      <div className="flex justify-between items-start mb-6">
        <div className="bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 px-4 py-2 rounded-lg font-bold text-2xl font-space-grotesk">
          {discountDisplay}
        </div>

        {badgeConfig_current && (
          <div
            className={`${badgeConfig_current.bgColor} ${badgeConfig_current.textColor} px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider`}
          >
            {badgeConfig_current.label}
          </div>
        )}
      </div>

      {/* Title & Description */}
      <h3 className="text-xl font-bold font-space-grotesk text-white mb-2">
        {promotion.description || 'Khuyến mãi đặc biệt'}
      </h3>
      <p className="text-slate-400 text-sm mb-6 leading-relaxed min-h-[2.5rem]">
        {promotion.conditions && promotion.conditions[0]
          ? promotion.conditions[0]
          : 'Áp dụng cho các sản phẩm được chọn'}
      </p>

      {/* Code Box */}
      <div className="bg-slate-700/50 rounded-xl p-4 flex items-center justify-between mb-6 group-hover:bg-slate-700 transition-colors border border-slate-600">
        <span className="font-mono font-bold text-lg text-indigo-300">
          {promotion.code}
        </span>
        <Button
          onClick={handleCopy}
          variant="secondary"
          size="sm"
          icon="content_copy"
          className="text-cyan-400 hover:text-cyan-300"
        >
          {copied ? 'Đã sao chép!' : 'Sao chép'}
        </Button>
      </div>

      {/* Footer with expiry & terms */}
      <div className="flex items-center justify-between text-xs text-slate-400 font-medium pt-4 border-t border-slate-700">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
          </svg>
          <span>Hạn: {expiryText}</span>
        </div>
        <Button
          onClick={() => setShowConditionsModal(true)}
          variant="secondary"
          size="sm"
          className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 !font-bold"
        >
          Điều kiện
        </Button>
      </div>

      {/* Usage indicator (optional) */}
      {promotion.usageLimit !== 999999 && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Sử dụng: {promotion.usedCount}/{promotion.usageLimit}</span>
            <span>
              {Math.round((promotion.usedCount / promotion.usageLimit) * 100)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-300"
              style={{
                width: `${(promotion.usedCount / promotion.usageLimit) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      <ConditionsModal
        isOpen={showConditionsModal}
        title={promotion.description || 'Điều kiện khuyến mãi'}
        conditions={promotion.conditions}
        onClose={() => setShowConditionsModal(false)}
      />
    </div>
  )
}

export default PromotionCard
