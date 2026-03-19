import { FC, useEffect, useState, useCallback } from 'react'
import { cn } from '../../utils/cn'
import Icon from '../atomic/Icon'

interface TimerProps {
  /**
   * End time for countdown (Date object or timestamp)
   */
  endTime: Date | number
  /**
   * Callback when countdown reaches 0
   */
  onEnd?: () => void
  className?: string
  /**
   * Show icon before timer
   */
  showIcon?: boolean
}

interface TimeLeft {
  hours: string
  minutes: string
  seconds: string
  isExpired: boolean
}

/**
 * Countdown timer component for flash sales
 * @component
 * @example
 * <Timer endTime={new Date("2026-03-10T23:59:59")} onEnd={() => {...}} />
 */
const Timer: FC<TimerProps> = ({ endTime, onEnd, className, showIcon = true }) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    hours: '00',
    minutes: '00',
    seconds: '00',
    isExpired: false,
  })

  const calculateTimeLeft = useCallback(() => {
    const now = new Date().getTime()
    const end = new Date(endTime).getTime()
    const difference = end - now

    if (difference <= 0) {
      setTimeLeft({
        hours: '00',
        minutes: '00',
        seconds: '00',
        isExpired: true,
      })
      onEnd?.()
      return
    }

    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
    const minutes = Math.floor((difference / (1000 * 60)) % 60)
    const seconds = Math.floor((difference / 1000) % 60)

    setTimeLeft({
      hours: String(hours).padStart(2, '0'),
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
      isExpired: false,
    })
  }, [endTime, onEnd])

  useEffect(() => {
    // Calculate immediately
    calculateTimeLeft()

    // Update every second
    const interval = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [calculateTimeLeft])

  if (timeLeft.isExpired) {
    return (
      <div className={cn('flex items-center gap-2 bg-red-500/10 text-red-500 px-3 py-1 rounded-lg border border-red-500/20', className)}>
        {showIcon && <Icon name="timer" size="sm" />}
        <span className="font-mono font-bold text-sm">Đã kết thúc</span>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-2 bg-red-500/10 text-red-500 px-3 py-1 rounded-lg border border-red-500/20', className)}>
      {showIcon && <Icon name="timer" size="sm" />}
      <span className="font-mono font-bold text-sm">
        {timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}
      </span>
    </div>
  )
}

export default Timer
