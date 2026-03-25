import { FC, useRef } from 'react'
import { Icon } from '../atomic'
import { cn } from '../../utils/cn'

interface CustomSelectOption {
  code: number | string
  name: string
}

interface CustomSelectProps {
  label: string
  value: string | number
  options: CustomSelectOption[]
  onChange: (value: number | string) => void
  placeholder?: string
  required?: boolean
}

const CustomSelect: FC<CustomSelectProps> = ({
  label,
  value,
  options,
  onChange,
  placeholder = '-- Chọn --',
  required = false,
}) => {
  const detailsRef = useRef<HTMLDetailsElement>(null)

  const selectedOption = options.find(opt => opt.code === value)
  const displayLabel = selectedOption?.name || placeholder

  const handleSelect = (optionCode: number | string) => {
    onChange(optionCode)
    detailsRef.current?.removeAttribute('open')
  }

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
        {label} {required && '*'}
      </label>
      <details ref={detailsRef} className="group relative">
        <summary className="flex items-center justify-between px-4 py-3 bg-slate-900/40 border border-indigo-500/40 rounded-lg text-white text-sm cursor-pointer hover:border-indigo-400/50 focus:border-indigo-400 focus:bg-slate-900/60 transition list-none outline-none">
          <span className="font-medium">
            {displayLabel}
          </span>
          <Icon name="expand_more" size="sm" className="group-open:rotate-180 transition text-indigo-400" />
        </summary>
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-indigo-500/30 rounded-lg shadow-2xl z-50 overflow-y-auto max-h-64">
          {options.map((option) => (
            <button
              key={option.code}
              type="button"
              onClick={() => handleSelect(option.code)}
              className={cn(
                'w-full text-left px-4 py-3 text-sm font-medium transition border-l-2',
                value === option.code
                  ? 'bg-indigo-500/20 text-indigo-400 border-l-indigo-400'
                  : 'text-slate-300 border-l-transparent hover:bg-indigo-700/50'
              )}
            >
              {option.name}
            </button>
          ))}
        </div>
      </details>
    </div>
  )
}

export default CustomSelect
