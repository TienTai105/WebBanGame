import { FC, useRef, useEffect, useState } from 'react'

interface OTPInputProps {
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  disabled?: boolean
  length?: number
}

const OTPInput: FC<OTPInputProps> = ({ value, onChange, onComplete, disabled = false, length = 6 }) => {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''))
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(length).fill(null))

  // Sync with prop value
  useEffect(() => {
    if (value.length === 0) {
      setOtp(Array(length).fill(''))
    }
  }, [value, length])

  const handleChange = (index: number, val: string) => {
    // Only allow single digit
    if (!/^\d?$/.test(val)) return

    const newOtp = [...otp]
    newOtp[index] = val

    setOtp(newOtp)

    // Update parent component
    const otpString = newOtp.join('')
    onChange(otpString)

    // Auto-focus to next field
    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Call onComplete when all fields are filled
    if (otpString.length === length && onComplete) {
      onComplete(otpString)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()

      const newOtp = [...otp]
      if (otp[index]) {
        // Clear current field
        newOtp[index] = ''
        setOtp(newOtp)
        onChange(newOtp.join(''))
      } else if (index > 0) {
        // Move to previous field and clear it
        newOtp[index - 1] = ''
        setOtp(newOtp)
        onChange(newOtp.join(''))
        inputRefs.current[index - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    const pastedDigits = pastedText.replace(/\D/g, '').split('').slice(0, length - index)

    if (pastedDigits.length > 0) {
      const newOtp = [...otp]
      pastedDigits.forEach((digit, i) => {
        if (index + i < length) {
          newOtp[index + i] = digit
        }
      })

      setOtp(newOtp)
      const otpString = newOtp.join('')
      onChange(otpString)

      // Focus on the last filled field
      const lastFilledIndex = Math.min(index + pastedDigits.length - 1, length - 1)
      inputRefs.current[lastFilledIndex]?.focus()

      // Call onComplete if all fields are filled
      if (otpString.length === length && onComplete) {
        onComplete(otpString)
      }
    }
  }

  return (
    <div className="flex justify-center gap-3 md:gap-4">
      {Array(length)
        .fill(0)
        .map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={otp[index]}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={(e) => handlePaste(e, index)}
            disabled={disabled}
            className="w-14 h-16 md:w-16 md:h-20 text-center text-2xl font-bold border-2 border-slate-700 rounded-lg bg-slate-800 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="-"
          />
        ))}
    </div>
  )
}

export default OTPInput
