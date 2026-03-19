import { FC } from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'

interface CheckboxProps {
  id?: string
  label?: string | React.ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

const Checkbox: FC<CheckboxProps> = ({
  id,
  label,
  checked,
  onChange,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <CheckboxPrimitive.Root
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        className="w-4 h-4 rounded border border-slate-700 bg-slate-800 cursor-pointer hover:border-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        <CheckboxPrimitive.Indicator className="w-full h-full flex items-center justify-center">
          <Check className="w-3 h-3 text-indigo-500" strokeWidth={3} />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label && (
        <label
          htmlFor={id}
          className="text-slate-400 text-sm cursor-pointer hover:text-slate-300 transition-colors select-none"
        >
          {label}
        </label>
      )}
    </div>
  )
}

export default Checkbox
