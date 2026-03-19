import { FC, ReactNode } from 'react'

interface InfoContactCardProps {
  title: string
  content: string
  subtext?: string
  icon: ReactNode
  iconBgColor: string
  iconColor: string
}

/**
 * Info Contact Card component - For displaying contact information
 * @component
 * @example
 * <InfoContactCard
 *   title="Hotline"
 *   content="1800-WEBGAME"
 *   subtext="Thứ 2 - Chủ nhật: 8:00 - 22:00"
 *   icon={<Phone className="w-6 h-6" />}
 *   iconBgColor="bg-indigo-500/20"
 *   iconColor="text-indigo-400"
 * />
 */
const InfoContactCard: FC<InfoContactCardProps> = ({
  title,
  content,
  subtext,
  icon,
  iconBgColor,
  iconColor,
}) => {
  return (
    <div className="bg-slate-800/50 rounded p-4 flex items-start gap-4">
      <div className={`${iconBgColor} rounded-lg p-3 flex-shrink-0`}>
        <div className={iconColor}>{icon}</div>
      </div>
      <div>
        <p className="text-white font-semibold mb-1">{title}</p>
        <p className="text-slate-300 text-sm mb-2">{content}</p>
        {subtext && <p className="text-slate-400 text-xs">{subtext}</p>}
      </div>
    </div>
  )
}

export default InfoContactCard
