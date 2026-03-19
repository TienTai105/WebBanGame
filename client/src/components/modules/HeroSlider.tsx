import { FC, useState, useEffect } from 'react'
import { cn } from '../../utils/cn'
import Button from '../atomic/Button'
import Icon from '../atomic/Icon'
import SectionContainer from '../atomic/SectionContainer'

interface Slide {
  backgroundImage: string
  title: string
  subtitle: string
  description?: string
}

interface HeroSliderProps {
  onExplore?: () => void
  onTrailer?: () => void
  slides?: Slide[]
  autoPlayInterval?: number
  className?: string
}

const DEFAULT_SLIDES: Slide[] = [
  {
    backgroundImage: '/images/heroslider.png',
    title: 'PlayStation 5',
    subtitle: 'Pro Edition',
  },
  {
    backgroundImage: '/images/heroslider.png',
    title: 'Xbox Series X',
    subtitle: 'Premium Gaming',
  },
  {
    backgroundImage: '/images/heroslider.png',
    title: 'Nintendo Switch',
    subtitle: 'Ultimate Portable',
  },
]

/**
 * Hero slider carousel with navigation and indicators
 * @component
 */
const HeroSlider: FC<HeroSliderProps> = ({
  onExplore,
  onTrailer,
  slides = DEFAULT_SLIDES,
  autoPlayInterval = 5000,
  className,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Auto-play carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length)
    }, autoPlayInterval)
    return () => clearInterval(interval)
  }, [slides.length, autoPlayInterval])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  const currentSlide = slides[currentIndex]

  return (
    <section
      className={cn('relative min-h-screen w-full flex items-center overflow-hidden', className)}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={currentSlide.backgroundImage}
          alt="Hero gaming background"
          className="w-full h-full object-cover"
          loading="eager"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-bg-dark via-bg-dark/80 to-transparent" />
      </div>

      {/* Content */}
      <SectionContainer className="relative z-10 h-full flex items-center">
        <div className="max-w-2xl">
          {/* Label */}
          <div className="flex items-center gap-2 mb-6">
            <span className="h-px w-12 bg-primary" />
            <span className="text-primary font-bold uppercase tracking-widest text-sm">
              Exclusive Launch
            </span>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-[1.1] tracking-tight">
            {currentSlide.title} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              {currentSlide.subtitle}
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg text-slate-300 mb-10 leading-relaxed">
            {currentSlide.description || 'Trải nghiệm đỉnh cao công nghệ gaming thế hệ mới. Hiệu năng vượt trội, hình ảnh chân thực cùng kho game độc quyền khổng lồ.'}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-6">
            <Button
              variant="primary"
              size="lg"
              onClick={onExplore}
              className="shadow-lg shadow-primary/25"
            >
              Khám Phá Ngay
            </Button>
            <Button variant="secondary" size="lg" onClick={onTrailer}>
              Xem Trailer
            </Button>
          </div>
        </div>
      </SectionContainer>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors group"
        aria-label="Previous slide"
      >
        <Icon name="chevron_left" size="xl" className="text-white group-hover:scale-110 transition-transform" />
      </button>

      <button
        onClick={goToNext}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors group"
        aria-label="Next slide"
      >
        <Icon name="chevron_right" size="xl" className="text-white group-hover:scale-110 transition-transform" />
      </button>

      {/* Slide Indicators (Dots) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={currentIndex === index 
              ? 'transition-all duration-300 w-8 h-2 bg-primary rounded-full' 
              : 'transition-all duration-300 w-2 h-2 bg-white/40 rounded-full hover:bg-white/60'}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  )
}

export default HeroSlider
