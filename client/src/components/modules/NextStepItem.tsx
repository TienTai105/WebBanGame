import { FC, ReactNode } from 'react'

interface NextStepItemProps {
  step: number
  title: string
  description: string
  icon?: ReactNode
}

/**
 * Next Step Item component - Shows individual step in order confirmation
 * @component
 * @example
 * <NextStepItem
 *   step={1}
 *   title="Kiểm tra email xác nhận"
 *   description="Nhân viên sẽ liên hệ bạn trong vòng 1-2 giờ"
 * />
 */
const NextStepItem: FC<NextStepItemProps> = ({
  step,
  title,
  description,
}) => {
  return (
    <div className="flex items-start gap-3">
      <div className="bg-indigo-500 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
        <span className="text-white text-sm font-bold">{step}</span>
      </div>
      <div className="flex-1">
        <p className="text-white font-semibold">{title}</p>
        <p className="text-slate-400 text-sm">{description}</p>
      </div>
    </div>
  )
}

export default NextStepItem
