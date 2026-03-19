import { FC } from 'react'
import { Check } from 'lucide-react'
import { cn } from '../../utils/cn'

export interface StepperStep {
  label: string
  description?: string
}

interface StepperProps {
  steps: StepperStep[]
  currentStep: number // 0-indexed
  onStepClick?: (stepIndex: number) => void
  className?: string
}

/**
 * Stepper component - Shows progress through multi-step process
 * @component
 * @example
 * <Stepper
 *   steps={[
 *     { label: 'Giỏ hàng' },
 *     { label: 'Thanh toán' },
 *     { label: 'Hoàn thành' }
 *   ]}
 *   currentStep={0}
 * />
 */
const Stepper: FC<StepperProps> = ({ steps, currentStep, onStepClick, className }) => {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = index === currentStep
          const isCompleted = index < currentStep
          const isClickable = isCompleted && onStepClick

          return (
            <div key={index} className="flex-1 flex items-center">
              {/* Step Circle */}
              <div className="flex flex-col items-center flex-shrink-0 justify-center">
                <button
                  onClick={() => isClickable && onStepClick(index)}
                  disabled={!isClickable}
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all',
                    isCompleted && 'bg-cyan-500 text-white cursor-pointer hover:bg-cyan-600',
                    isActive && 'bg-indigo-600 text-white border-2 border-indigo-400',
                    !isActive && !isCompleted && 'bg-slate-800 text-slate-400 border-2 border-slate-700',
                    isClickable && 'cursor-pointer'
                  )}
                  title={isClickable ? `Quay lại bước ${step.label}` : ''}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>
                <p className="text-sm font-bold text-white mt-2 text-center whitespace-nowrap">
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs text-slate-400 mt-1 text-center whitespace-nowrap">
                    {step.description}
                  </p>
                )}
              </div>

              {/* Connector Line - except for last step */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-1 mx-2 mt-0 bg-slate-800">
                  <div
                    className={cn(
                      'h-full transition-all duration-300',
                      isCompleted ? 'bg-cyan-500' : 'bg-transparent'
                    )}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Stepper
