import { FC, ReactNode } from 'react'

interface OrderInfoCardProps {
  label: string
  value: string | ReactNode
  variant?: 'default' | 'success' | 'warning' | 'info'
  colSpan?: 1 | 2
}

const variantStyles = {
  default: 'bg-slate-900 border-slate-800',
  success: 'bg-emerald-500/10 border-emerald-500',
  warning: 'bg-yellow-500/10 border-yellow-500',
  info: 'bg-cyan-500/10 border-cyan-500',
}

const labelColorStyles = {
  default: 'text-slate-400',
  success: 'text-emerald-400',
  warning: 'text-yellow-400',
  info: 'text-cyan-400',
}

const valueColorStyles = {
  default: 'text-white',
  success: 'text-emerald-400',
  warning: 'text-yellow-400',
  info: 'text-cyan-400',
}

/**
 * Info Card component for displaying order information
 * @component
 * @example
 * <OrderInfoCard label="Mã đơn hàng" value="ORDER-20260313-001234" variant="success" />
 */
const OrderInfoCard: FC<OrderInfoCardProps> = ({
  label,
  value,
  variant = 'default',
  colSpan = 1,
}) => {
  return (
    <div
      className={`border rounded-lg p-6 transition-all ${variantStyles[variant]} ${
        colSpan === 2 ? 'md:col-span-2' : ''
      }`}
    >
      <p className={`text-sm mb-2 ${labelColorStyles[variant]}`}>{label}</p>
      <div className={`text-lg font-bold ${valueColorStyles[variant]}`}>
        {value}
      </div>
    </div>
  )
}

export default OrderInfoCard
