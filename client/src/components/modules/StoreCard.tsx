import React from 'react'
import { Phone, Clock, MapPin} from 'lucide-react'

interface StoreCardProps {
  name: string
  type: 'flagship' | 'showroom'
  address: string
  hours: string[]
  phone: string
}

const StoreCard: React.FC<StoreCardProps> = ({
  name,
  type,
  address,
  hours,
  phone,
}) => {
  const isMain = type === 'flagship'
  const badgeLabel = type === 'flagship' ? 'Main Office' : 'Showroom'
  const badgeBg = isMain
    ? 'bg-indigo-500/20 text-indigo-300'
    : 'bg-slate-700/50 text-slate-300'

  return (
    <div
      className={`p-8 rounded-2xl transition-all duration-300 ${
        isMain
          ? 'bg-slate-800 border border-slate-700 hover:border-indigo-500/50 shadow-lg shadow-indigo-600/20'
          : 'bg-slate-800/50 border border-slate-700 hover:border-indigo-500/30'
      }`}
    >
      {/* Header with title & badge */}
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-xl font-bold text-white font-space-grotesk">
          {name}
        </h3>
        <span
          className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${badgeBg}`}
        >
          {badgeLabel}
        </span>
      </div>

      {/* Info sections */}
      <div className="space-y-4">
        {/* Address */}
        <div className="flex gap-3">
          <MapPin className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <p className="text-slate-300 text-sm leading-relaxed">{address}</p>
        </div>

        {/* Hours */}
        <div className="flex gap-3">
          <Clock className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="text-slate-300 text-sm">
            {hours.map((hour, idx) => (
              <p key={idx}>{hour}</p>
            ))}
          </div>
        </div>

        {/* Phone */}
        <div className="flex gap-3">
          <Phone className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <p className="text-slate-300 text-sm">{phone}</p>
        </div>
      </div>
    </div>
  )
}

export default StoreCard
